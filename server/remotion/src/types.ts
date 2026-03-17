export type AnimationType =
  | "fade"
  | "slide"
  | "scale"
  | "typewriter"
  | "slide-up"
  | "slide-down";

export type SceneType = "intro" | "content" | "cta";

export type MoodType = "energetic" | "cinematic" | "corporate" | "chill";

export interface Scene {
  type: SceneType;
  text: string;
  subtext?: string;
  backgroundColor: string;
  textColor: string;
  animation: AnimationType;
  duration: number;
  fontSize: number;
  mediaUrl?: string; // Optional specific media for this scene
}

export interface AudioConfig {
  trackUrl: any;
  mood: MoodType;
  trackIndex: number;
  volume: number;
  sfxVolume: number;
}

export interface VideoAssets {
  logoUrl?:      string; // shown in intro + CTA with spring animation
  bgImageUrl?:   string; // replaces solid bg on intro scene
  watermarkUrl?: string; // small fixed overlay on every scene
  mediaUrls?:    string[]; // array of images/videos to be used dynamically per scene
}

export interface VideoConfig {
  title: string;
  scenes: Scene[];
  fps: number;
  width: number;
  height: number;
  audio?: AudioConfig;
  assets?: VideoAssets; // ← NEW
}

export const DEFAULT_FPS = 30;
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
export const TRANSITION_FRAMES = 15;

export const DEFAULT_SCENE: Scene = {
  type: "content",
  text: "Default Text",
  backgroundColor: "#1a1a2e",
  textColor: "#ffffff",
  animation: "fade",
  duration: 3,
  fontSize: 64,
};

export function getTotalDurationInFrames(scenes: Scene[], fps: number): number {
  const totalFrames = scenes.reduce(
    (sum, scene) => sum + Math.ceil(scene.duration * fps),
    0,
  );
  const transitionOverlap = Math.max(0, scenes.length - 1) * TRANSITION_FRAMES;
  return Math.max(1, totalFrames - transitionOverlap);
}