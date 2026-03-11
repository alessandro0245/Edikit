import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { WordByWord } from './WordByWord';
import { ParticleLayer } from './ParticleLayer';
import { GrainOverlay } from './GrainOverlay';
import { SceneAudio } from './Sceneaudio';
import type { Scene, AudioConfig, MoodType } from '../types';

// ─── Button Styles per Mood ───────────────────────────────────────────────────
function getButtonStyle(
  mood: MoodType | undefined,
  textColor: string,
  frame: number,
  buttonScale: number,
  pulse: number,
): React.CSSProperties {
  const glowIntensity = 10 + Math.sin(frame * 0.07) * 5;

  switch (mood) {
    case 'energetic':
      return {
        transform: `scale(${buttonScale * pulse})`,
        padding: '24px 72px',
        borderRadius: 4,
        backgroundColor: textColor,
        boxShadow: `0 0 ${glowIntensity * 2}px ${textColor}99`,
      };
    case 'cinematic':
      return {
        transform: `scale(${buttonScale * pulse})`,
        padding: '20px 60px',
        borderRadius: 0,
        border: `1px solid ${textColor}`,
        backgroundColor: 'transparent',
        boxShadow: `inset 0 0 ${glowIntensity}px ${textColor}22, 0 0 ${glowIntensity}px ${textColor}44`,
      };
    case 'corporate':
      return {
        transform: `scale(${buttonScale * pulse})`,
        padding: '22px 64px',
        borderRadius: 8,
        border: `2px solid ${textColor}`,
        backgroundColor: `${textColor}18`,
      };
    case 'chill':
    default:
      return {
        transform: `scale(${buttonScale * pulse})`,
        padding: '22px 64px',
        borderRadius: 50,
        border: `1.5px solid ${textColor}88`,
        backgroundColor: `${textColor}12`,
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 ${glowIntensity}px ${textColor}33`,
      };
  }
}

// ─── Layout Variants ──────────────────────────────────────────────────────────
type CTALayout = 'centered' | 'split' | 'bottom-anchor' | 'full-bleed';

function getLayout(sceneIndex: number, mood: MoodType | undefined): CTALayout {
  const layouts: CTALayout[] = ['centered', 'split', 'bottom-anchor', 'full-bleed'];
  // Mood bias + scene index for variety
  const moodOffset = mood === 'energetic' ? 1 : mood === 'cinematic' ? 2 : mood === 'corporate' ? 3 : 0;
  return layouts[(sceneIndex + moodOffset) % layouts.length];
}

// ─── Contrast Background ──────────────────────────────────────────────────────
function getContrastBg(backgroundColor: string): string {
  // Invert lightness for max contrast from previous scene
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  // Dark bg → use a lighter shifted variant; light bg → darker
  const shift = brightness < 128 ? 40 : -40;
  const nr = Math.min(255, Math.max(0, r + shift));
  const ng = Math.min(255, Math.max(0, g + shift));
  const nb = Math.min(255, Math.max(0, b + shift));
  return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
}

// ─── CTA Scene ────────────────────────────────────────────────────────────────
export const CTAScene: React.FC<{
  scene: Scene;
  sceneIndex?: number;
  audio?: AudioConfig;
  previousBgColor?: string;
}> = ({ scene, sceneIndex = 2, audio, previousBgColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mood = audio?.mood as MoodType | undefined;
  const layout = getLayout(sceneIndex, mood);

  // Use contrasting bg if previous scene color is provided
  const bgColor = previousBgColor
    ? getContrastBg(previousBgColor)
    : scene.backgroundColor;

  const buttonScale = spring({
    fps,
    frame: Math.max(0, frame - 25),
    config: { damping: 10, stiffness: 120, mass: 0.8 },
    from: 0,
    to: 1,
  });

  const buttonOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const pulse = 1 + Math.sin((frame - 40) * 0.06) * 0.015 * (frame > 40 ? 1 : 0);
  const buttonStyle = getButtonStyle(mood, scene.textColor, frame, buttonScale, pulse);

  // ── Layout: Centered (default) ──
  const renderCentered = () => (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 120px', gap: 48 }}>
      <WordByWord text={scene.text} animation={scene.animation} color={scene.textColor} fontSize={scene.fontSize} delay={5} staggerFrames={4} staggerPattern="cascade" />
      {scene.subtext && (
        <div style={{ opacity: buttonOpacity, ...buttonStyle }}>
          <span style={{ color: mood === 'energetic' ? bgColor : scene.textColor, fontSize: Math.round(scene.fontSize * 0.38), fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: 3, textTransform: 'uppercase' }}>
            {scene.subtext}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );

  // ── Layout: Split ──
  const renderSplit = () => (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0 100px', gap: 80 }}>
      <div style={{ flex: 1 }}>
        <WordByWord text={scene.text} animation={scene.animation} color={scene.textColor} fontSize={Math.round(scene.fontSize * 0.9)} delay={5} staggerFrames={4} staggerPattern="wave" />
      </div>
      {scene.subtext && (
        <div style={{ flex: 0, opacity: buttonOpacity, ...buttonStyle }}>
          <span style={{ color: mood === 'energetic' ? bgColor : scene.textColor, fontSize: Math.round(scene.fontSize * 0.35), fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {scene.subtext}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );

  // ── Layout: Bottom Anchor ──
  const renderBottomAnchor = () => (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: '0 120px 120px' }}>
      <div style={{ marginBottom: 60 }}>
        <WordByWord text={scene.text} animation={scene.animation} color={scene.textColor} fontSize={scene.fontSize} delay={5} staggerFrames={3} staggerPattern="explosive" />
      </div>
      {scene.subtext && (
        <div style={{ opacity: buttonOpacity, ...buttonStyle }}>
          <span style={{ color: mood === 'energetic' ? bgColor : scene.textColor, fontSize: Math.round(scene.fontSize * 0.38), fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: 3, textTransform: 'uppercase' }}>
            {scene.subtext}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );

  // ── Layout: Full Bleed ──
  const renderFullBleed = () => (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0 80px', gap: 48 }}>
      <WordByWord text={scene.text} animation={scene.animation} color={scene.textColor} fontSize={Math.round(scene.fontSize * 1.1)} delay={5} staggerFrames={3} staggerPattern="cascade" />
      {scene.subtext && (
        <div style={{ opacity: buttonOpacity, ...buttonStyle }}>
          <span style={{ color: mood === 'energetic' ? bgColor : scene.textColor, fontSize: Math.round(scene.fontSize * 0.38), fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: 3, textTransform: 'uppercase' }}>
            {scene.subtext}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );

  const renderLayout = () => {
    switch (layout) {
      case 'split': return renderSplit();
      case 'bottom-anchor': return renderBottomAnchor();
      case 'full-bleed': return renderFullBleed();
      default: return renderCentered();
    }
  };

  return (
    <AbsoluteFill>
      <BackgroundLayer backgroundColor={bgColor} accentColor={scene.textColor} gradientVariant={(sceneIndex % 3) as 0 | 1 | 2} />
      <ParticleLayer color={scene.textColor} seed={sceneIndex * 11 + 5} density="high" />
      {renderLayout()}
      <GrainOverlay opacity={0.04} />
      {audio && <SceneAudio animation={scene.animation} sfxVolume={audio.sfxVolume} delay={5} />}
    </AbsoluteFill>
  );
};