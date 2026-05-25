import { WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { voiceTelemetryService } from "./VoiceTelemetryService.js";
import { agentOrchestrator } from "./AgentOrchestrator.js";

const uuidv4 = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const MAX_CLIENT_MESSAGE_BYTES = Number(process.env.MAX_CLIENT_MESSAGE_BYTES || 256 * 1024);
const MAX_QUEUED_MESSAGES = Number(process.env.MAX_QUEUED_MESSAGES || 120);

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private knowledgeBase: string;
  // FIX-5: systemInstructionCache removed — handleConnection() uses
  // agentOrchestrator.getSystemInstruction(); this Map was never read.
  private sessionStates = new Map<string, { isInterrupted: boolean }>();

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
    this.knowledgeBase = this.loadKnowledgeBase();
  }

  async handleConnection(clientWs: WebSocket, lang: string = 'en', selectedVoice: string = 'Zephyr', welcome: boolean = true, visitorName: string = '') {
    const sessionId = uuidv4();
    console.log(`[GeminiLive] New session: ${sessionId} (Lang: ${lang}, Welcome: ${welcome}, Visitor: ${visitorName})`);
    this.sessionStates.set(sessionId, { isInterrupted: false });
    voiceTelemetryService.startSession(sessionId, { lang, voice: selectedVoice, welcome });
    agentOrchestrator.startSession({ sessionId, lang, voice: selectedVoice, welcome, visitorName });

    let session: any;
    let sessionReady = false;
    const queuedMessages: any[] = [];

    // Register message handler immediately so we never miss or drop any message
    // (such as initial text context) sent during the async connection setup!
    clientWs.on('message', (data: any) => {
      const payload = data.toString();
      const byteLength = Buffer.byteLength(payload);
      if (byteLength > MAX_CLIENT_MESSAGE_BYTES) {
        console.warn(`[GeminiLive] Closing oversized client message for session ${sessionId}: ${byteLength} bytes`);
        voiceTelemetryService.mark(sessionId, 'error', {
          reason: 'message_too_large',
          byteLength,
        });
        clientWs.close(1009, 'message_too_large');
        return;
      }

      if (!sessionReady) {
        try {
          const msg = JSON.parse(payload);
          if ((msg.text || msg.audio || msg.realtimeInput) && queuedMessages.length < MAX_QUEUED_MESSAGES) {
            if (msg.text) {
              console.log(`[GeminiLive] Queued text prompt for session ${sessionId} during connection setup: ${msg.text.substring(0, 60)}...`);
            }
            queuedMessages.push(data);
          }
        } catch (e) {
          // Ignore unparsable or raw audio chunks during connection setup
        }
        return;
      }
      void this.processClientMessage(session, sessionId, data, clientWs);
    });

    clientWs.on("close", (code, reason) => {
      console.log(`[GeminiLive] Session ${sessionId} closed`);
      this.sessionStates.delete(sessionId);
      voiceTelemetryService.closeSession(sessionId, code, reason.toString());
      agentOrchestrator.endSession(sessionId);
      if (session) {
        try {
          session.close();
        } catch (e) {
          console.error(`[GeminiLive] Error closing session ${sessionId}:`, e);
        }
      }
    });

    try {
      session = await this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => this.handleServerMessage(clientWs, sessionId, message, session),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: { parts: [{ text: agentOrchestrator.getSystemInstruction(lang, visitorName) }] },
          tools: [{
            functionDeclarations: [
              {
                name: "saveVisitorName",
                description: "Saves the visitor's name when they introduce themselves or tell you their name.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "The name of the visitor (e.g. Abebaw, John)."
                    }
                  },
                  required: ["name"]
                }
              },
              {
                name: "qualifySector",
                description: "Registers the target industry sector of the visitor's fleet or business.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    sector: {
                      type: Type.STRING,
                      description: "The business sector, e.g., logistics, construction, FMCG, distribution, manufacturing, or other."
                    }
                  },
                  required: ["sector"]
                }
              },
              {
                name: "submitBusinessLead",
                description: "Submits a qualified sales lead or business inquiry to Translink's backend.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    fullName: {
                      type: Type.STRING,
                      description: "Full name of the contact person."
                    },
                    companyName: {
                      type: Type.STRING,
                      description: "Name of their company (optional)."
                    },
                    email: {
                      type: Type.STRING,
                      description: "Email address of the contact person."
                    },
                    phone: {
                      type: Type.STRING,
                      description: "Phone number of the contact person."
                    },
                    preferredContactMethod: {
                      type: Type.STRING,
                      description: "Visitor's preferred contact channel. Must be one of: 'live_demo', 'scheduled_call', 'email_follow_up', 'project_consultation'."
                    },
                    bestContactTime: {
                      type: Type.STRING,
                      description: "Preferred day/time for follow-up (optional)."
                    },
                    requestedServiceDetails: {
                      type: Type.STRING,
                      description: "Any specific requests, fleet size, or project details they mentioned."
                    }
                  },
                  required: ["fullName", "email", "phone", "preferredContactMethod"]
                }
              }
            ]
          }]
        }
      });

      // Mark session as ready and drain queued messages
      sessionReady = true;
      voiceTelemetryService.mark(sessionId, 'gemini_connected');
      console.log(`[GeminiLive] Session ${sessionId} connected successfully. Processing ${queuedMessages.length} queued messages.`);
      for (const data of queuedMessages) {
        await this.processClientMessage(session, sessionId, data, clientWs);
      }

      if (welcome) {
        // Initial prompt — natural, warm, human-like welcome
        let initialPrompt = agentOrchestrator.getWelcomePrompt(lang, visitorName);
        if (lang === 'ar') {
          initialPrompt = visitorName
            ? `أهلاً بك مجدداً يا ${visitorName} في ترانسلينك. رحّب به بحرارة بأسلوب طبيعي وموجز في جملتين قصيرتين فقط.`
            : `رحّب بالزائر بحرارة. في تحيتك، قل بفخر أن ترانسلينك هي الحل الشامل الوحيد — ONE STOP SOLUTION — لتيليماتكس الأساطيل وتتبع GPS وإدارة الوقود والسلامة المدعومة بالذكاء الاصطناعي في شرق أفريقيا. شدد على "الحل الشامل الوحيد" بفخر وحماس. جملتان قصيرتان فقط. تحدث بالعربية الفصيحة بأسلوب طبيعي، واطلب اسمه بلطف.`;
        } else if (lang === 'am') {
          initialPrompt = visitorName
            ? `እንኳን ደህና መጡ ${visitorName}! ሰላምታ ይስጡት እና ዛሬ በምን ልንረዳው እንደምንችል በአጭሩ ይጠይቁት።`
            : `ጎብኝውን በሞቅ ልብ ተቀበሏቸው። ሰላምታዎ ውስጥ ትራንስሊንክ በምስራቅ አፍሪካ ለፍሊት ቴሌማቲክስ፣ GPS ክትትል፣ የነዳጅ ቁጥጥር እና AI ደህንነት ONE STOP SOLUTION — ሁሉንም በአንድ ቦታ — መሆኑን በኩራት ይናገሩ። "One Stop Solution" ን አጽንኦት ይስጡ። 2 አጫጭር ተፈጥሮአዊ ዓረፍተ ነገሮች ብቻ። በደመቀ አማርኛ ይናገሩ፣ ስማቸውንም በትህትና ይጠይቁ።`;
        }
        
        // Wait a moment for connection stabilization
        setTimeout(() => {
          if (!session) return;
          
          console.log(`[GeminiLive] Sending initial welcome prompt to session ${sessionId}`);
          
          // Use sendClientContent instead of sendRealtimeInput for guaranteed text prompt processing
          // and correct conversational context initialization.
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: initialPrompt }] }],
            turnComplete: true
          });
        }, 500);
      } else {
        console.log(`[GeminiLive] Skipping initial welcome prompt for session ${sessionId} as welcome has already played.`);
      }

    } catch (error: any) {
      console.error(`[GeminiLive] Connection failed for ${sessionId}:`, error);
      voiceTelemetryService.mark(sessionId, 'error', {
        stage: 'gemini_connect',
        message: error.message || String(error),
      });
      clientWs.send(JSON.stringify({ error: error.message || "Failed to connect to AI Service" }));
      clientWs.close();
    }
  }

  private async processClientMessage(session: any, sessionId: string, data: any, clientWs: WebSocket) {
    if (!session) return;
    
    try {
      const msg = JSON.parse(data.toString());
      if (msg.metric) {
        voiceTelemetryService.recordClientMetric(sessionId, msg.metric);
      }

      if (msg.interrupt) {
        console.log(`[GeminiLive] Client interruption signal for session ${sessionId}: ${msg.reason || 'user_interrupt'}`);
        voiceTelemetryService.mark(sessionId, 'client_interrupt', {
          reason: msg.reason || 'user_interrupt',
        });
        const state = this.sessionStates.get(sessionId);
        if (state) {
          state.isInterrupted = true;
        }
        clientWs.send(JSON.stringify({ interrupted: true }));
        // Signal the stream end to Gemini using the correct SDK method.
        // Empty turns[] is not a valid API call — instead mark the audio stream as ended
        // so Gemini knows the current user turn is complete. The isInterrupted flag above
        // handles suppressing any residual audio from the model's in-flight response.
        try {
          session.sendRealtimeInput({ audioStreamEnd: true });
        } catch (serr) {
          console.warn(`[GeminiLive] Failed to send audioStreamEnd cancel signal to Gemini session ${sessionId}:`, serr);
        }
      }

      if (msg.audio) {
        const state = this.sessionStates.get(sessionId);
        if (state) {
          state.isInterrupted = false;
        }
        voiceTelemetryService.increment(sessionId, 'clientAudioFrames');
        voiceTelemetryService.mark(sessionId, 'first_client_audio');
        session.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: msg.mimeType || "audio/pcm;rate=16000",
          },
        });
      }

      if (msg.audioStreamEnd) {
        console.log(`[GeminiLive] Client audio stream ended for session ${sessionId}`);
        voiceTelemetryService.mark(sessionId, 'client_audio_stream_end');
        session.sendRealtimeInput({ audioStreamEnd: true });
      }

      if (msg.realtimeInput && msg.realtimeInput.mediaChunks) {
        const state = this.sessionStates.get(sessionId);
        if (state) {
          state.isInterrupted = false;
        }
        // Backward-compatible path for older Robot client builds.
        const chunks = msg.realtimeInput.mediaChunks;
        for (const chunk of chunks) {
          session.sendRealtimeInput({
            audio: {
              mimeType: chunk.mimeType,
              data: chunk.data,
            },
          });
        }
      }

      if (msg.realtimeInput?.audioStreamEnd) {
        voiceTelemetryService.mark(sessionId, 'client_audio_stream_end');
        session.sendRealtimeInput({ audioStreamEnd: true });
      }
      
      if (msg.text && session) {
        const state = this.sessionStates.get(sessionId);
        if (state) {
          state.isInterrupted = false;
        }
        console.log(`[GeminiLive] Forwarding text prompt to Gemini session ${sessionId}:`, msg.text.substring(0, 80) + '...');
        const orchestratedPrompt = await agentOrchestrator.buildUserTurn(sessionId, msg.text);
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: orchestratedPrompt }] }],
          turnComplete: true
        });
      }
    } catch (e) {
      console.error(`[GeminiLive] Error parsing client message for session ${sessionId}:`, e);
      voiceTelemetryService.mark(sessionId, 'error', {
        stage: 'process_client_message',
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  private async handleServerMessage(clientWs: WebSocket, sessionId: string, message: LiveServerMessage, session?: any) {
    console.log(`[GeminiLive] Received server message for session ${sessionId}:`, JSON.stringify(message).substring(0, 200) + '...');
    
    // Check for error in the message
    if ((message as any).error) {
      console.error(`[GeminiLive] API Server error for session ${sessionId}:`, (message as any).error);
      voiceTelemetryService.mark(sessionId, 'error', {
        stage: 'gemini_message',
        message: (message as any).error.message || 'Gemini Live API error',
      });
      clientWs.send(JSON.stringify({ error: (message as any).error.message || "Gemini Live API error" }));
      return;
    }

    // Notify setup complete
    if ((message as any).setupComplete) {
      console.log(`[GeminiLive] Session ${sessionId} setup complete. Notifying client.`);
      voiceTelemetryService.mark(sessionId, 'setup_complete');
      clientWs.send(JSON.stringify({ setupComplete: true }));
      return;
    }


    // 3. Handle serverContent — route audio, transcription, and turnComplete to the client
    if (message.serverContent) {
      const content = message.serverContent as any;
      const state = this.sessionStates.get(sessionId);
      const isInterrupted = state?.isInterrupted ?? false;

      // Route model turn audio and text chunks only when NOT interrupted
      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('audio/')) {
            if (!isInterrupted) {
              voiceTelemetryService.increment(sessionId, 'modelAudioChunks');
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            } else {
              voiceTelemetryService.increment(sessionId, 'serverInterruptions');
              console.log(`[GeminiLive] Dropping audio chunk for interrupted session ${sessionId}`);
            }
          }
          if (part.text && !isInterrupted) {
            clientWs.send(JSON.stringify({ text: part.text }));
          }
        }
      }

      // Always forward turnComplete — client needs to know to stop buffering
      if (content.turnComplete) {
        console.log(`[GeminiLive] Turn complete for session ${sessionId}`);
        voiceTelemetryService.mark(sessionId, 'turn_complete');
        clientWs.send(JSON.stringify({ turnComplete: true }));
      }

      return;
    }

    // 4. Handle Tool Calls
    if (message.toolCall?.functionCalls) {
      const functionCalls = message.toolCall.functionCalls;
      console.log(`[GeminiLive] Received ${functionCalls.length} tool calls for session ${sessionId}`);
      
      const responses: any[] = [];
      
      for (const fc of functionCalls) {
        const id = fc.id;
        const name = fc.name;
        const args = fc.args || {};
        
        console.log(`[GeminiLive] Processing tool call ${name} (ID: ${id}) with args:`, args);
        
        if (name === 'saveVisitorName') {
          const visitorName = String(args.name || '').trim();
          if (visitorName) {
            const orchestratorSession = agentOrchestrator.getSession(sessionId);
            if (orchestratorSession) {
              orchestratorSession.visitorName = visitorName;
            }
            clientWs.send(JSON.stringify({ visitorName }));
          }
          responses.push({
            id,
            name,
            response: { success: true, message: `Visitor name '${visitorName}' saved successfully.` }
          });
        } else if (name === 'qualifySector') {
          const sector = String(args.sector || '').trim();
          console.log(`[GeminiLive] Qualified sector: ${sector} for session ${sessionId}`);
          responses.push({
            id,
            name,
            response: { success: true, message: `Sector set to ${sector}.` }
          });
        } else if (name === 'submitBusinessLead') {
          try {
            const leadsDir = path.resolve(process.cwd(), 'src/translinkconfig/logs');
            await fs.promises.mkdir(leadsDir, { recursive: true });
            
            const leadEntry = JSON.stringify({
              timestamp: new Date().toISOString(),
              sessionId,
              fullName: args.fullName,
              companyName: args.companyName,
              email: args.email,
              phone: args.phone,
              preferredContactMethod: args.preferredContactMethod,
              bestContactTime: args.bestContactTime,
              requestedServiceDetails: args.requestedServiceDetails,
            }) + '\n';
            
            await fs.promises.appendFile(path.join(leadsDir, 'leads.jsonl'), leadEntry);
            console.log(`[GeminiLive] Lead submitted successfully for session ${sessionId}`);
            clientWs.send(JSON.stringify({ leadSubmitted: true }));
            
            responses.push({
              id,
              name,
              response: { success: true, message: "Sales lead submitted to Translink backend successfully." }
            });
          } catch (err: any) {
            console.error('[GeminiLive] Error writing lead:', err);
            responses.push({
              id,
              name,
              response: { success: false, error: err.message || "Failed to submit lead to backend." }
            });
          }
        } else {
          console.warn(`[GeminiLive] Unknown tool call name: ${name}`);
          responses.push({
            id,
            name,
            response: { success: false, error: `Function '${name}' is not implemented.` }
          });
        }
      }
      
      if (session && responses.length > 0) {
        console.log(`[GeminiLive] Sending tool response to Gemini for session ${sessionId}:`, JSON.stringify(responses));
        try {
          session.sendToolResponse({ functionResponses: responses });
        } catch (err) {
          console.error(`[GeminiLive] Error sending tool response for session ${sessionId}:`, err);
        }
      }
    }
  }

  private loadKnowledgeBase(): string {
    try {
      // Resolve from both process.cwd() (always the repo root on Render)
      // and relative to this file (works in both source-run and compiled-dist-server modes).
      const candidates = [
        path.resolve(process.cwd(), 'src', 'translinkconfig', 'live-voice'),
        path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'translinkconfig', 'live-voice'),
      ];
      const configDir = candidates.find((d) => fs.existsSync(d)) || '';
      if (!configDir) return '';

      const files = fs.readdirSync(configDir);
      let dynamicKnowledge = "";
      for (const file of files) {
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          const filePath = path.join(configDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          dynamicKnowledge += `\n\n--- KNOWLEDGE FROM ${file} ---\n${fileContent}`;
        }
      }

      console.log(`[GeminiLive] Loaded voice knowledge base from ${configDir}`);
      return dynamicKnowledge;
    } catch (err) {
      console.error('[GeminiLive] Error loading dynamic AI knowledge base:', err);
      return "";
    }
  }
}
