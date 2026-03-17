import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  random,
} from 'remotion';
import { SceneAudio } from './Sceneaudio';
import { BgImageLayer } from './BgImageLayer';
import { LogoLayer } from './LogoLayer';
import type { Scene, AudioConfig } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPortrait(w: number, h: number) { return h > w; }
function isSquare(w: number, h: number)   { return w === h; }

function scaleFontSize(fs: number, w: number, h: number): number {
  if (isPortrait(w, h)) return Math.round(fs * 0.68);
  if (isSquare(w, h))   return Math.round(fs * 0.78);
  return fs;
}

// Parse hex to rgb
function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

// Derive harmonious palette from a base color
function palette(base: string) {
  const [r, g, b] = hexRgb(base);
  const rn = r/255, gn = g/255, bn = b/255;
  const max = Math.max(rn,gn,bn), min = Math.min(rn,gn,bn);
  const l = (max+min)/2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === rn)      h = ((gn-bn)/d + (gn<bn?6:0))/6;
    else if (max === gn) h = ((bn-rn)/d+2)/6;
    else                 h = ((rn-gn)/d+4)/6;
  }
  const hd = h*360;
  const toHex = (hh: number, ss: number, ll: number) => {
    hh = ((hh%360)+360)%360;
    const c=(1-Math.abs(2*ll-1))*ss, x=c*(1-Math.abs((hh/60)%2-1)), m=ll-c/2;
    let ro=0,go=0,bo=0;
    if(hh<60){ro=c;go=x}else if(hh<120){ro=x;go=c}else if(hh<180){go=c;bo=x}
    else if(hh<240){go=x;bo=c}else if(hh<300){ro=x;bo=c}else{ro=c;bo=x}
    const t=(n:number)=>Math.round((n+m)*255).toString(16).padStart(2,'0');
    return `#${t(ro)}${t(go)}${t(bo)}`;
  };
  const sat = Math.max(0.7, s);
  const lit = Math.min(0.55, Math.max(0.42, l));
  return {
    primary:     base,
    secondary:   toHex(hd+45,  sat,       lit),
    tertiary:    toHex(hd+90,  sat*0.85,  lit*0.9),
    complement:  toHex(hd+180, sat*0.9,   lit),
    glow:        `rgba(${r},${g},${b},0.15)`,
    glowStrong:  `rgba(${r},${g},${b},0.35)`,
  };
}

// ─── Glitch effect ────────────────────────────────────────────────────────────
// RGB channel split on scene entry — 3-5 frames of chaos then settles

const GlitchOverlay: React.FC<{ accentColor: string; seed: number }> = ({ accentColor, seed }) => {
  const frame = useCurrentFrame();
  if (frame > 6) return null;

  const [r, , b] = hexRgb(accentColor);
  const intensity = interpolate(frame, [0, 6], [1, 0], { extrapolateRight: 'clamp' });
  const offsetX = (random(`glitch-x-${seed}-${frame}`) - 0.5) * 20 * intensity;
  const offsetY = (random(`glitch-y-${seed}-${frame}`) - 0.5) * 8  * intensity;

  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
      {/* Red channel offset */}
      <AbsoluteFill style={{
        background: `rgba(${r},0,0,${0.6 * intensity})`,
        transform:  `translate(${offsetX}px, ${-offsetY}px)`,
      }} />
      {/* Blue channel offset */}
      <AbsoluteFill style={{
        background: `rgba(0,0,${b},${0.6 * intensity})`,
        transform:  `translate(${-offsetX}px, ${offsetY}px)`,
      }} />
    </AbsoluteFill>
  );
};

// ─── Scanlines ────────────────────────────────────────────────────────────────
const Scanlines: React.FC = () => (
  <AbsoluteFill style={{
    background: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.08) 3px,
      rgba(0,0,0,0.08) 4px
    )`,
    pointerEvents: 'none',
    zIndex: 10,
  }} />
);

// ─── Animated number stamp ────────────────────────────────────────────────────
const SceneStamp: React.FC<{ index: number; color: string; width: number; height: number }> = ({
  index, color, width, height,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 40, 60], [0, 0.06, 0.06, 0], {
    extrapolateRight: 'clamp',
  });
  const scale = spring({ fps: 30, frame, config: { damping: 200, stiffness: 30 }, from: 1.4, to: 1 });

  return (
    <div style={{
      position:      'absolute',
      bottom:        -height * 0.05,
      right:         -width * 0.02,
      opacity,
      transform:     `scale(${scale})`,
      transformOrigin: 'bottom right',
      color,
      fontSize:      Math.round(Math.min(width, height) * 0.55),
      fontWeight:    900,
      fontFamily:    '"Arial Black", Arial, sans-serif',
      lineHeight:    1,
      userSelect:    'none',
      pointerEvents: 'none',
    }}>
      {String(index + 1).padStart(2, '0')}
    </div>
  );
};

// ─── Word slam animation ──────────────────────────────────────────────────────
// Each word slams in — scales from big to normal with elastic spring

interface WordSlamProps {
  words:     string[];
  fontSize:  number;
  color:     string;
  delay:     number;   // frame offset for this line
  stagger:   number;   // frames between each word
  bold?:     boolean;
}

const WordSlam: React.FC<WordSlamProps> = ({
  words, fontSize, color, delay, stagger, bold = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(fontSize * 0.2), alignItems: 'baseline' }}>
      {words.map((word, i) => {
        const wordDelay = delay + i * stagger;
        const wordFrame = Math.max(0, frame - wordDelay);

        const scale = spring({
          fps,
          frame: wordFrame,
          config: { damping: 9, stiffness: 220, mass: 0.5 },
          from:   1.6,
          to:     1,
        });

        const opacity = interpolate(wordFrame, [0, 4], [0, 1], {
          extrapolateRight: 'clamp',
          extrapolateLeft:  'clamp',
        });

        // Slight upward drift on entry
        const translateY = interpolate(wordFrame, [0, 8], [fontSize * 0.3, 0], {
          extrapolateRight: 'clamp',
          extrapolateLeft:  'clamp',
        });

        return (
          <span
            key={i}
            style={{
              display:        'inline-block',
              color,
              fontSize,
              fontWeight:     bold ? 900 : 600,
              fontFamily:     '"Arial Black", "Arial Bold", Arial, sans-serif',
              letterSpacing:  bold ? 3 : 1,
              textTransform:  'uppercase' as const,
              lineHeight:     1.05,
              opacity,
              transform:      `scale(${scale}) translateY(${translateY}px)`,
              transformOrigin: 'bottom center',
              whiteSpace:     'nowrap' as const,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Wipe reveal line ─────────────────────────────────────────────────────────
// A colored bar sweeps left→right revealing text underneath — cinematic feel

interface WipeLineProps {
  text:      string;
  fontSize:  number;
  textColor: string;
  barColor:  string;
  delay:     number;
  width:     number;
  isSubtext?: boolean;
}

const WipeLine: React.FC<WipeLineProps> = ({
  text, fontSize, textColor, barColor, delay, width, isSubtext = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bar sweeps across
  const barProgress = spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: { damping: 200, stiffness: 150 },
    from: 0,
    to:   1,
  });

  // Text fades in as bar reveals it
  const textOpacity = interpolate(
    frame,
    [delay + 3, delay + 14],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );

  const hPad = Math.round(width * 0.042);
  const vPad = isSubtext ? Math.round(fontSize * 0.2) : Math.round(fontSize * 0.28);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', marginLeft: hPad }}>
      {/* Sweeping bar — full width, sweeps then retracts */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: barColor,
        transformOrigin: 'left center',
        transform:  `scaleX(${barProgress})`,
      }} />

      {/* Text revealed underneath */}
      <div style={{
        position:    'relative',
        paddingLeft:  Math.round(fontSize * 0.4),
        paddingRight: Math.round(fontSize * 0.5),
        paddingTop:   vPad,
        paddingBottom: vPad,
        opacity:      textOpacity,
      }}>
        <span style={{
          color:         textColor,
          fontSize,
          fontWeight:    isSubtext ? 600 : 900,
          fontFamily:    '"Arial Black", Arial, sans-serif',
          letterSpacing: isSubtext ? 2 : 3,
          textTransform: 'uppercase' as const,
          lineHeight:    1,
          display:       'block',
          whiteSpace:    'nowrap' as const,
        }}>
          {text}
        </span>
      </div>
    </div>
  );
};

// ─── Accent line draw ─────────────────────────────────────────────────────────
const AccentLine: React.FC<{ color: string; delay: number; width: number }> = ({
  color, delay, width,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hPad = Math.round(width * 0.042);

  const lineWidth = spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: { damping: 200, stiffness: 80 },
    from:   0,
    to:     width - hPad * 2,
  });

  const opacity = interpolate(frame, [delay, delay + 5], [0, 0.9], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ paddingLeft: hPad, opacity }}>
      <div style={{
        width:        lineWidth,
        height:       4,
        background:   color,
        borderRadius: 2,
        boxShadow:    `0 0 12px ${color}, 0 0 24px ${color}44`,
      }} />
    </div>
  );
};

// ─── Background glow ──────────────────────────────────────────────────────────
const BackgroundGlow: React.FC<{ color: string; frame: number }> = ({ color, frame }) => {
  const intensity = interpolate(frame, [0, 8, 30, 60], [0, 1, 0.6, 0.3], {
    extrapolateRight: 'clamp',
  });
  const [r, g, b] = hexRgb(color);
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse 80% 60% at 20% 50%, rgba(${r},${g},${b},${0.18 * intensity}), transparent 70%)`,
      pointerEvents: 'none',
    }} />
  );
};

// ─── KineticScene — Main export ───────────────────────────────────────────────

export const KineticScene: React.FC<{
  scene:       Scene;
  sceneIndex?: number;
  audio?:      AudioConfig;
  bgImageUrl?: string;
  logoUrl?:    string;
}> = ({ scene, sceneIndex = 0, audio, bgImageUrl, logoUrl }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const fontSize    = scaleFontSize(scene.fontSize, width, height);
  const subFontSize = Math.round(fontSize * 0.42);
  const isNarrow    = isPortrait(width, height) || isSquare(width, height);

  // Build palette from scene's accent color
  const colors = palette(scene.textColor);

  // Split text on pipe for multiple lines
  const mainLines = scene.text.split('|').map((l) => l.trim()).filter(Boolean);
  const allLines  = scene.subtext
    ? [...mainLines, scene.subtext]
    : mainLines;

  // Line colors — cycle through palette
  const lineColors = [colors.primary, colors.secondary, colors.tertiary, colors.complement];

  // Animation style alternates per scene for variety
  // Even scenes: wipe reveal, Odd scenes: word slam
  const useWipe = sceneIndex % 2 === 0;
  const STAGGER = 7; // frames between lines

  // Scale-in on entry
  const sceneScale = spring({
    fps,
    frame,
    config: { damping: 200, stiffness: 60 },
    from:   1.025,
    to:     1,
  });

  return (
    <AbsoluteFill style={{
      background:      bgImageUrl ? 'transparent' : '#030303',
      transform:       `scale(${sceneScale})`,
      transformOrigin: 'center center',
      overflow:        'hidden',
    }}>
      {bgImageUrl && <BgImageLayer imageUrl={bgImageUrl} />}

      {/* Background glow — color bleeds from left */}
      {!bgImageUrl && <BackgroundGlow color={scene.textColor} frame={frame} />}

      {/* Scanlines */}
      <Scanlines />

      {logoUrl && (
        <LogoLayer
          logoUrl={logoUrl}
          position="top-left"
          size={isNarrow ? 80 : 120}
          delay={8}
          scene="intro"
        />
      )}

      {/* Lines — stacked vertically, left-aligned, centered vertically */}
      <AbsoluteFill style={{
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'flex-start',
        gap:            Math.round(fontSize * 0.15),
      }}>
        {allLines.map((line, i) => {
          const isSubtext = scene.subtext && i === allLines.length - 1;
          const delay     = i * STAGGER + 2;
          const color     = lineColors[i % lineColors.length];
          const fs        = isSubtext ? subFontSize : fontSize;

          if (useWipe) {
            return (
              <WipeLine
                key={i}
                text={line}
                fontSize={fs}
                textColor="#ffffff"
                barColor={color}
                delay={delay}
                width={width}
                isSubtext={!!isSubtext}
              />
            );
          } else {
            // Word slam — words fly in individually
            const words = line.split(' ').filter(Boolean);
            const hPad  = Math.round(width * 0.042);
            return (
              <div key={i} style={{ paddingLeft: hPad }}>
                <WordSlam
                  words={words}
                  fontSize={fs}
                  color={color}
                  delay={delay}
                  stagger={3}
                  bold={!isSubtext}
                />
              </div>
            );
          }
        })}

        {/* Accent line draws in after all text */}
        <AccentLine
          color={colors.primary}
          delay={allLines.length * STAGGER + 4}
          width={width}
        />
      </AbsoluteFill>

      {/* Big scene number stamp — transparent watermark */}
      <SceneStamp
        index={sceneIndex}
        color={scene.textColor}
        width={width}
        height={height}
      />

      {/* Glitch on entry */}
      <GlitchOverlay accentColor={scene.textColor} seed={sceneIndex} />

      {audio && (
        <SceneAudio
          animation={scene.animation}
          sfxVolume={audio.sfxVolume}
          sceneIndex={sceneIndex}
          delay={0}
        />
      )}
    </AbsoluteFill>
  );
};