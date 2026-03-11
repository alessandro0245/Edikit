import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { WordByWord } from './WordByWord';
import { ParticleLayer } from './ParticleLayer';
import { GrainOverlay } from './GrainOverlay';
import { SceneAudio } from './Sceneaudio';
import type { Scene, AudioConfig } from '../types';

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function isPortrait(w: number, h: number) { return h > w; }
function isSquare(w: number, h: number)   { return w === h; }

function scaleFont(fontSize: number, width: number, height: number): number {
  if (isPortrait(width, height)) return Math.round(fontSize * 0.72);
  if (isSquare(width, height))   return Math.round(fontSize * 0.82);
  return fontSize;
}

function hPad(width: number): number {
  return width <= 1080 ? 72 : 120;
}

// ─── Derive a safe accent color from backgroundColor ─────────────────────────
// This is used ONLY for the BackgroundLayer gradient — never for text.
// We shift the hue of the bg color to create a complementary glow that
// won't interfere with text readability.
function deriveAccentFromBg(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  const r   = parseInt(hex.slice(0, 2), 16);
  const g   = parseInt(hex.slice(2, 4), 16);
  const b   = parseInt(hex.slice(4, 6), 16);

  // Convert to HSL
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn)      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else                 h = ((rn - gn) / d + 4) / 6;
  }

  // Shift hue by 150° and boost saturation/lightness for a visible glow
  const newH = (h * 360 + 150) % 360;
  const newS = Math.min(1, s + 0.3);
  const newL = Math.max(0.45, Math.min(0.7, l + 0.3)); // always mid-bright so it glows

  // Convert back to hex
  const c  = (1 - Math.abs(2 * newL - 1)) * newS;
  const x  = c * (1 - Math.abs((newH / 60) % 2 - 1));
  const m  = newL - c / 2;
  let ro = 0, go = 0, bo = 0;
  const nh = newH;
  if (nh < 60)       { ro = c; go = x; bo = 0; }
  else if (nh < 120) { ro = x; go = c; bo = 0; }
  else if (nh < 180) { ro = 0; go = c; bo = x; }
  else if (nh < 240) { ro = 0; go = x; bo = c; }
  else if (nh < 300) { ro = x; go = 0; bo = c; }
  else               { ro = c; go = 0; bo = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(ro)}${toHex(go)}${toHex(bo)}`;
}

// ─── Intro Scene ──────────────────────────────────────────────────────────────
export const IntroScene: React.FC<{
  scene: Scene;
  sceneIndex?: number;
  audio?: AudioConfig;
}> = ({ scene, sceneIndex = 0, audio }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const narrow      = isPortrait(width, height) || isSquare(width, height);
  const fontSize    = scaleFont(scene.fontSize, width, height);
  const padding     = hPad(width);

  // ── KEY FIX: accentColor for BackgroundLayer is derived from bg, NOT textColor ──
  // This prevents the gradient overlay from being the same color as the text,
  // which was causing the "invisible text on intro" bug.
  const bgAccent = deriveAccentFromBg(scene.backgroundColor);

  const lineWidth = spring({
    fps, frame,
    config: { damping: 200, stiffness: 60 },
    from: 0,
    to: narrow ? 140 : 220,
    delay: 10,
  });

  const lineOpacity = interpolate(frame, [10, 25], [0, 0.6], {
    extrapolateRight: 'clamp',
  });

  const sceneScale = spring({
    fps, frame,
    config: { damping: 200, stiffness: 40 },
    from: 1.04,
    to: 1,
  });

  const patterns: Array<'cascade' | 'wave' | 'explosive'> = ['cascade', 'wave', 'explosive'];
  const staggerPattern = patterns[sceneIndex % patterns.length];

  return (
    <AbsoluteFill style={{ transform: `scale(${sceneScale})` }}>
      <BackgroundLayer
        backgroundColor={scene.backgroundColor}
        accentColor={bgAccent}          // ← derived accent, never textColor
        gradientVariant={(sceneIndex % 3) as 0 | 1 | 2}
      />
      <ParticleLayer
        color={scene.textColor}         // particles use textColor — fine, they're small dots
        seed={sceneIndex * 13 + 7}
        density="normal"
      />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: `0 ${padding}px`,
        gap: narrow ? 20 : 30,
      }}>
        <WordByWord
          text={scene.text}
          animation={scene.animation}
          color={scene.textColor}       // text color is always from palette pair
          fontSize={fontSize}
          delay={5}
          staggerFrames={4}
          staggerPattern={staggerPattern}
        />

        {/* Animated underline */}
        <div style={{
          width:           lineWidth,
          height:          narrow ? 2 : 3,
          backgroundColor: scene.textColor,
          borderRadius:    2,
          opacity:         lineOpacity,
        }} />

        {scene.subtext && (
          <WordByWord
            text={scene.subtext}
            animation="fade"
            color={scene.textColor}
            fontSize={Math.round(fontSize * 0.42)}
            delay={22}
            fontWeight={400}
            staggerFrames={3}
            staggerPattern="cascade"
          />
        )}
      </AbsoluteFill>

      <GrainOverlay opacity={0.04} />
      {audio && (
        <SceneAudio animation={scene.animation} sfxVolume={audio.sfxVolume} delay={5} />
      )}
    </AbsoluteFill>
  );
};