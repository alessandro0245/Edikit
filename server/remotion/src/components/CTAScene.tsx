import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { LogoLayer } from './LogoLayer';
import { WordByWord } from './WordByWord';
import { ParticleLayer } from './ParticleLayer';
import { GrainOverlay } from './GrainOverlay';
import { SceneAudio } from './Sceneaudio';
import type { Scene, AudioConfig, MoodType } from '../types';

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function isPortrait(w: number, h: number) { return h > w; }
function isSquare(w: number, h: number)   { return w === h; }
function isNarrow(w: number, h: number)   { return isPortrait(w, h) || isSquare(w, h); }

// Horizontal padding — tighter on narrow canvases
function hPad(width: number): number {
  return width <= 1080 ? 72 : 120;
}

// Scale fontSize down for non-landscape so text + button both fit
function scaleFont(fontSize: number, width: number, height: number): number {
  if (isPortrait(width, height)) return Math.round(fontSize * 0.72);
  if (isSquare(width, height))   return Math.round(fontSize * 0.82);
  return fontSize;
}

// Button font size — proportional to canvas, capped so it never overflows
function btnFontSize(fontSize: number, width: number, height: number): number {
  const scaled = scaleFont(fontSize, width, height);
  // Button label is ~36% of scene font — further cap at 28px on narrow
  const raw = Math.round(scaled * 0.36);
  return isNarrow(width, height) ? Math.min(raw, 28) : raw;
}

// Max button width — always stays inside padding
function btnMaxWidth(width: number): number {
  return width - hPad(width) * 2;
}

// ─── Button style per mood ────────────────────────────────────────────────────
function getButtonStyle(
  mood: MoodType | undefined,
  textColor: string,
  frame: number,
  buttonScale: number,
  pulse: number,
  width: number,
  height: number,
): React.CSSProperties {
  const glow    = 10 + Math.sin(frame * 0.07) * 5;
  const narrow  = isNarrow(width, height);
  const vPad    = narrow ? 16 : 22;
  const hPadBtn = narrow ? 32 : 56;

  const base: React.CSSProperties = {
    transform:   `scale(${buttonScale * pulse})`,
    padding:     `${vPad}px ${hPadBtn}px`,
    maxWidth:    `${btnMaxWidth(width)}px`,
    width:       'fit-content',
    boxSizing:   'border-box',
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'center',
    transformOrigin: 'center center',
  };

  switch (mood) {
    case 'energetic':
      return { ...base, borderRadius: 4, backgroundColor: textColor, boxShadow: `0 0 ${glow * 2}px ${textColor}99` };
    case 'cinematic':
      return { ...base, borderRadius: 0, border: `1px solid ${textColor}`, backgroundColor: 'transparent', boxShadow: `inset 0 0 ${glow}px ${textColor}22, 0 0 ${glow}px ${textColor}44` };
    case 'corporate':
      return { ...base, borderRadius: 8, border: `2px solid ${textColor}`, backgroundColor: `${textColor}18` };
    case 'chill':
    default:
      return { ...base, borderRadius: 50, border: `1.5px solid ${textColor}88`, backgroundColor: `${textColor}12`, backdropFilter: 'blur(8px)', boxShadow: `0 0 ${glow}px ${textColor}33` };
  }
}

// ─── Layout — split never on narrow ──────────────────────────────────────────
type CTALayout = 'centered' | 'split' | 'bottom-anchor' | 'full-bleed';

function getLayout(
  sceneIndex: number,
  mood: MoodType | undefined,
  width: number,
  height: number,
): CTALayout {
  if (isNarrow(width, height)) {
    // Only column layouts on portrait/square
    const safe: CTALayout[] = ['centered', 'bottom-anchor', 'centered', 'full-bleed'];
    const offset = mood === 'energetic' ? 1 : mood === 'cinematic' ? 2 : 0;
    return safe[(sceneIndex + offset) % safe.length];
  }
  const all: CTALayout[] = ['centered', 'split', 'bottom-anchor', 'full-bleed'];
  const offset = mood === 'energetic' ? 1 : mood === 'cinematic' ? 2 : mood === 'corporate' ? 3 : 0;
  return all[(sceneIndex + offset) % all.length];
}

function getContrastBg(backgroundColor: string): string {
  const hex = backgroundColor.replace('#', '');
  const r   = parseInt(hex.slice(0, 2), 16);
  const g   = parseInt(hex.slice(2, 4), 16);
  const b   = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const shift = brightness < 128 ? 40 : -40;
  const nr = Math.min(255, Math.max(0, r + shift));
  const ng = Math.min(255, Math.max(0, g + shift));
  const nb = Math.min(255, Math.max(0, b + shift));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

// ─── CTA Scene ────────────────────────────────────────────────────────────────
export const CTAScene: React.FC<{
  scene: Scene;
  sceneIndex?: number;
  audio?: AudioConfig;
  previousBgColor?: string;
  logoUrl?: string; // ← NEW
}> = ({ scene, sceneIndex = 2, audio, previousBgColor, logoUrl }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const mood    = audio?.mood as MoodType | undefined;
  const layout  = getLayout(sceneIndex, mood, width, height);
  const padding = hPad(width);
  const narrow  = isNarrow(width, height);

  const bgColor = previousBgColor
    ? getContrastBg(previousBgColor)
    : scene.backgroundColor;

  // Scale scene font for non-landscape
  const sceneFontSize = scaleFont(scene.fontSize, width, height);
  const labelFontSize = btnFontSize(scene.fontSize, width, height);

  const buttonScale = spring({
    fps,
    frame: Math.max(0, frame - 25),
    config: { damping: 10, stiffness: 120, mass: 0.8 },
    from: 0,
    to: 1,
  });

  const buttonOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft:  'clamp',
  });

  const pulse       = 1 + Math.sin((frame - 40) * 0.06) * 0.015 * (frame > 40 ? 1 : 0);
  const buttonStyle = getButtonStyle(mood, scene.textColor, frame, buttonScale, pulse, width, height);
  const btnTextColor = mood === 'energetic' ? bgColor : scene.textColor;

  // Button label — wrappable, centered, size-capped
  const btnLabel = scene.subtext ? (
    <span style={{
      color:         btnTextColor,
      fontSize:      labelFontSize,
      fontWeight:    700,
      fontFamily:    'Inter, sans-serif',
      letterSpacing: narrow ? 2 : 3,
      textTransform: 'uppercase' as const,
      // Allow wrapping so text never clips outside button
      whiteSpace:    'normal' as const,
      wordBreak:     'break-word' as const,
      display:       'block',
      textAlign:     'center' as const,
      lineHeight:    1.3,
    }}>
      {scene.subtext}
    </span>
  ) : null;

  const btn = btnLabel ? (
    <div style={{ opacity: buttonOpacity, ...buttonStyle }}>
      {btnLabel}
    </div>
  ) : null;

  // ── Centered ──
  const renderCentered = () => (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: `0 ${padding}px`, gap: narrow ? 36 : 48,
    }}>
      <WordByWord
        text={scene.text} animation={scene.animation}
        color={scene.textColor} fontSize={sceneFontSize}
        delay={5} staggerFrames={4} staggerPattern="cascade"
      />
      {btn}
    </AbsoluteFill>
  );

  // ── Split — landscape only ──
  const renderSplit = () => (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'row',
      alignItems: 'center', padding: `0 ${padding}px`, gap: 80,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <WordByWord
          text={scene.text} animation={scene.animation}
          color={scene.textColor} fontSize={Math.round(sceneFontSize * 0.9)}
          delay={5} staggerFrames={4} staggerPattern="wave"
        />
      </div>
      {btn && <div style={{ flexShrink: 0 }}>{btn}</div>}
    </AbsoluteFill>
  );

  // ── Bottom Anchor ──
  const renderBottomAnchor = () => (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', alignItems: 'center',
      padding: `0 ${padding}px ${Math.round(height * 0.1)}px`,
    }}>
      <div style={{ marginBottom: narrow ? 40 : 60 }}>
        <WordByWord
          text={scene.text} animation={scene.animation}
          color={scene.textColor} fontSize={sceneFontSize}
          delay={5} staggerFrames={3} staggerPattern="explosive"
        />
      </div>
      {btn}
    </AbsoluteFill>
  );

  // ── Full Bleed ──
  const renderFullBleed = () => (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'flex-start',
      padding: `0 ${padding}px`, gap: narrow ? 36 : 48,
    }}>
      <WordByWord
        text={scene.text} animation={scene.animation}
        color={scene.textColor} fontSize={Math.round(sceneFontSize * (narrow ? 1 : 1.1))}
        delay={5} staggerFrames={3} staggerPattern="cascade"
      />
      {btn}
    </AbsoluteFill>
  );

  const renderLayout = () => {
    switch (layout) {
      case 'split':         return renderSplit();
      case 'bottom-anchor': return renderBottomAnchor();
      case 'full-bleed':    return renderFullBleed();
      default:              return renderCentered();
    }
  };

  return (
    <AbsoluteFill>
      <BackgroundLayer
        backgroundColor={bgColor}
        accentColor={scene.textColor}
        gradientVariant={(sceneIndex % 3) as 0 | 1 | 2}
      />
      <ParticleLayer color={scene.textColor} seed={sceneIndex * 11 + 5} density="high" />
      {renderLayout()}
      {/* Logo — top-right on CTA, smaller than intro */}
      {logoUrl && (
        <LogoLayer
          logoUrl={logoUrl}
          position="top-right"
          size={isNarrow(width, height) ? 70 : 100}
          delay={20}
          scene="cta"
        />
      )}
      <GrainOverlay opacity={0.04} />
      {audio && <SceneAudio animation={scene.animation} sfxVolume={audio.sfxVolume} sceneIndex={sceneIndex} delay={5} />}
    </AbsoluteFill>
  );
};