/* ==========================================================================
   CAMERA TYPES - Camera Path module types
   ========================================================================== */

export interface CameraConfig {
    cameraKeyframesDesktop: Keyframe[];
    cameraKeyframesTablet: Keyframe[];
    cameraKeyframesMobile: Keyframe[];
}

export interface Keyframe {
    scroll: number;
    distance: number;
    angleY: number;
    angleX: number;
    target: {
        x: number;
        y: number;
        z: number;
    };
    ease: string;
    section: string;
}

export type TimelineType = 'desktop' | 'tablet' | 'mobile';
