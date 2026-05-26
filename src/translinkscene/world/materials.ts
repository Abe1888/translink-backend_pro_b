/**
 * Material Applicator Utility
 *
 * Applies material configurations to loaded 3D models
 */

import * as THREE from 'three';
import { ConfigStore } from '../../translinkconfig/ConfigStore';

export function applyMaterials(model: THREE.Group): void {
    const materialsConfig = ConfigStore.get('material').materials as Record<string, any>;
    model.traverse((child: THREE.Object3D) => {
        if (!(child as THREE.Mesh).isMesh) return;

        const mesh = child as THREE.Mesh;
        const name = mesh.name;

        let materialConfig: any | null = null;

        // Apply material based on mesh name
        switch (name) {
            case 'Bolt_01':
            case 'Bolt_02':
            case 'Bolt_03':
            case 'Bolt_04':
                materialConfig = materialsConfig.bolt;
                break;
            case 'Fuel_Head':
                materialConfig = materialsConfig.fuelHead;
                break;
            case 'Fuel_Head_cover':
                materialConfig = materialsConfig.fuelHeadCover;
                break;
            case 'Text_Translink_pro':
            case 'Logo_Translink_pro':
                materialConfig = materialsConfig.brandLogo;
                break;
            case 'Harness':
                materialConfig = materialsConfig.harness;
                break;
            case 'Prob':
                materialConfig = materialsConfig.prob;
                break;
            case 'Base':
                materialConfig = materialsConfig.base;
                break;
            case 'Filter':
                materialConfig = materialsConfig.filter;
                break;
            case 'Filter_Wireframe':
                materialConfig = materialsConfig.filterWireframe;
                break;
            case 'Fuel_tank':
                materialConfig = materialsConfig.fuelTank;
                break;
            case 'Belt':
                materialConfig = materialsConfig.belt;
                break;
            case 'light':
                materialConfig = materialsConfig.light;
                break;
            case 'virtual_studio':
                materialConfig = materialsConfig.virtualStudio;
                break;
            case 'Truck':
            case 'Cab_door':
            case 'Cab_Door_glass_frame':
                materialConfig = materialsConfig.truckBody;
                break;
            case 'Cab_Glass':
            case 'Cab_door_glass':
                materialConfig = materialsConfig.truckGlass;
                break;
            case 'Truck_Lights':
                materialConfig = materialsConfig.truckLights;
                break;
            case 'axle001_Front_wheel_Left':
            case 'axle001_Front_wheel_Right':
            case 'axle002_wheel_Both_Left_Right':
            case 'axle003_wheel_Both_Left_Right':
                // Check if name contains 'wheel' part for tire vs hub?
                // For simplicity, using truckTires for these
                materialConfig = materialsConfig.truckTires;
                break;
            case 'Ground_point':
            case 'Wall_point':
            case 'virtual_studio_Ground_Spline_Circle_collisions':
                mesh.visible = false;
                return;
            default:
                if (
                    name.includes('_3D_point') ||
                    name.includes('_Ref_Point') ||
                    name.toLowerCase().includes('guide') ||
                    name.toLowerCase().includes('marker') ||
                    name.toLowerCase().includes('point')
                ) {
                    mesh.visible = false;
                    return;
                }
                break;
        }

        if (materialConfig) {
            const props = { ...materialConfig };

            // Handle hex strings from JSON
            if (typeof props.color === 'string' && props.color.startsWith('#')) {
                props.color = new THREE.Color(props.color);
            }

            if (typeof props.emissive === 'string' && props.emissive.startsWith('#')) {
                props.emissive = new THREE.Color(props.emissive);
            }

            const material = new THREE.MeshPhysicalMaterial(props);

            if (name === 'virtual_studio') {
                material.side = THREE.DoubleSide;
            }

            mesh.material = material;
            mesh.material.needsUpdate = true;
        }

        // mesh.visible = true; // RECOVERY: Let World.ts handle authoritative visibility
        mesh.frustumCulled = false;
        // All real-geometry meshes both cast AND receive shadows so inter-component
        // self-shadowing works throughout S1-S10. virtual_studio is the only mesh
        // excluded from casting (it is a backdrop, not an object).
        mesh.castShadow = name !== 'virtual_studio';
        mesh.receiveShadow = true; // was: name === 'virtual_studio' — blocked all self-shadowing
    });

    // Call the theme applicator immediately to apply starting theme properties
    const isDark = document.documentElement.classList.contains('dark');
    applyThemeToMaterials(model, isDark);
}

/**
 * Dynamically updates all mesh materials based on whether the dark theme is active.
 * Implements high-end space-graphite obsidian truck panels, dark polished steel,
 * glowing red fuel cover accents, and neon tech brand logos.
 */
export function applyThemeToMaterials(model: THREE.Group, isDark: boolean): void {
    const materialsConfig = ConfigStore.get('material').materials as Record<string, any>;
    model.traverse((child: THREE.Object3D) => {
        if (!(child as THREE.Mesh).isMesh) return;

        const mesh = child as THREE.Mesh;
        const name = mesh.name;
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        if (!mat || !mat.isMeshStandardMaterial) return;

        switch (name) {
            case 'virtual_studio': {
                const config = materialsConfig.virtualStudio || {};
                const baseColor = config.color || '#f5f1e8';
                mat.color.set(isDark ? '#0c0e12' : baseColor);
                mat.roughness = config.roughness !== undefined ? config.roughness : 1.0;
                mat.metalness = config.metalness !== undefined ? config.metalness : 0.0;
                break;
            }

            case 'Truck':
            case 'Cab_door':
            case 'Cab_Door_glass_frame': {
                const config = materialsConfig.truckBody || {};
                const baseColor = config.color || '#d8d4d0';
                mat.color.set(isDark ? '#1d2330' : baseColor);
                mat.roughness = isDark ? 0.24 : (config.roughness !== undefined ? config.roughness : 0.95);
                mat.metalness = isDark ? 0.72 : (config.metalness !== undefined ? config.metalness : 0.0);
                mat.envMapIntensity = isDark ? 2.6 : (config.envMapIntensity !== undefined ? config.envMapIntensity : 0.5);
                if ('clearcoat' in mat) {
                    mat.clearcoat = config.clearcoat !== undefined ? config.clearcoat : 1.0;
                    mat.clearcoatRoughness = isDark ? 0.08 : (config.clearcoatRoughness !== undefined ? config.clearcoatRoughness : 0.05);
                }
                break;
            }

            case 'Fuel_tank': {
                const config = materialsConfig.fuelTank || {};
                const baseColor = config.color || '#d1d5db';
                mat.color.set(isDark ? '#1a1f29' : baseColor);
                mat.roughness = isDark ? 0.2 : (config.roughness !== undefined ? config.roughness : 0.38);
                mat.metalness = config.metalness !== undefined ? config.metalness : 0.95;
                mat.envMapIntensity = isDark ? 1.6 : (config.envMapIntensity !== undefined ? config.envMapIntensity : 0.3);
                break;
            }

            case 'Fuel_Head_cover': {
                const config = materialsConfig.fuelHeadCover || {};
                const baseColor = config.color || '#c0202f';
                mat.color.set(baseColor);
                mat.roughness = isDark ? 0.1 : (config.roughness !== undefined ? config.roughness : 0.72);
                mat.metalness = isDark ? 0.3 : (config.metalness !== undefined ? config.metalness : 0.0);
                mat.envMapIntensity = config.envMapIntensity !== undefined ? config.envMapIntensity : 0.35;
                if ('clearcoat' in mat) {
                    mat.clearcoat = isDark ? 0.9 : (config.clearcoat !== undefined ? config.clearcoat : 0.1);
                    mat.clearcoatRoughness = isDark ? 0.1 : (config.clearcoatRoughness !== undefined ? config.clearcoatRoughness : 0.35);
                }
                if (mat.emissive) {
                    const emissiveColor = config.emissive || baseColor;
                    mat.emissive.set(isDark ? emissiveColor : '#000000');
                    mat.emissiveIntensity = isDark ? (config.emissiveIntensity !== undefined ? config.emissiveIntensity : 0.25) : 0.0;
                }
                break;
            }

            case 'Fuel_Head': {
                const config = materialsConfig.fuelHead || {};
                const baseColor = config.color || '#161616';
                mat.color.set(isDark ? '#13161d' : baseColor);
                mat.roughness = isDark ? 0.2 : (config.roughness !== undefined ? config.roughness : 0.35);
                mat.metalness = isDark ? 0.6 : (config.metalness !== undefined ? config.metalness : 0.4);
                break;
            }

            case 'Prob': {
                const config = materialsConfig.prob || {};
                const baseColor = config.color || '#fafafa';
                mat.color.set(baseColor);
                mat.roughness = isDark ? 0.05 : (config.roughness !== undefined ? config.roughness : 0.1);
                mat.metalness = config.metalness !== undefined ? config.metalness : 0.95;
                mat.envMapIntensity = isDark ? 1.6 : (config.envMapIntensity !== undefined ? config.envMapIntensity : 1.0);
                break;
            }

            case 'Base': {
                const config = materialsConfig.base || {};
                const baseColor = config.color || '#2a2a2a';
                mat.color.set(isDark ? '#1a1e26' : baseColor);
                mat.roughness = isDark ? 0.25 : (config.roughness !== undefined ? config.roughness : 0.4);
                mat.metalness = isDark ? 0.85 : (config.metalness !== undefined ? config.metalness : 0.8);
                break;
            }

            case 'Filter_Wireframe': {
                const config = materialsConfig.filterWireframe || {};
                const baseColor = config.color || '#c0202f';
                mat.color.set(baseColor);
                if (mat.emissive) {
                    const emissiveColor = config.emissive || baseColor;
                    mat.emissive.set(isDark ? emissiveColor : '#000000');
                    mat.emissiveIntensity = isDark ? (config.emissiveIntensity !== undefined ? config.emissiveIntensity : 0.4) : 0.0;
                }
                break;
            }

            case 'Text_Translink_pro':
            case 'Logo_Translink_pro': {
                const config = materialsConfig.brandLogo || {};
                const baseColor = config.color || '#ffffff';
                mat.color.set(baseColor);
                if (mat.emissive) {
                    const emissiveColor = config.emissive || baseColor;
                    mat.emissive.set(emissiveColor);
                    mat.emissiveIntensity = isDark ? (config.emissiveIntensity !== undefined ? config.emissiveIntensity : 1.3) : 0.8;
                }
                break;
            }

            case 'Bolt_01':
            case 'Bolt_02':
            case 'Bolt_03':
            case 'Bolt_04': {
                const config = materialsConfig.bolt || {};
                const baseColor = config.color || '#2a2a2a';
                mat.color.set(isDark ? '#1f2937' : baseColor);
                mat.roughness = isDark ? 0.2 : (config.roughness !== undefined ? config.roughness : 0.4);
                mat.metalness = isDark ? 0.9 : (config.metalness !== undefined ? config.metalness : 0.8);
                break;
            }
        }

        mat.needsUpdate = true;
    });
}

