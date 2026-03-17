import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

interface BackgroundLayerProps {
  backgroundColor: string;
  accentColor?: string;
  gradientVariant?: 0 | 1 | 2; // 0=linear, 1=radial burst, 2=diagonal sweep
}

function adjustBrightness(hex: string, amount: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  backgroundColor,
  accentColor,
  gradientVariant = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const colorB = accentColor ?? adjustBrightness(backgroundColor, -35);
  const colorC = adjustBrightness(backgroundColor, 20);

  // Animated values
  const angle = interpolate(frame, [0, durationInFrames], [120, 240], { extrapolateRight: 'clamp' });
  const radialX = interpolate(frame, [0, durationInFrames], [25, 75], { extrapolateRight: 'clamp' });
  const radialY = interpolate(frame, [0, durationInFrames], [35, 65], { extrapolateRight: 'clamp' });
  const overlayOpacity = 0.1 + Math.sin(frame * 0.035) * 0.05;
  const sweepOffset = interpolate(frame, [0, durationInFrames], [-10, 10], { extrapolateRight: 'clamp' });

  // ── Variant 0: Animated Linear Gradient ──
  const linearBg = {
    background: `linear-gradient(${angle}deg, ${backgroundColor} 0%, ${colorB} 60%, ${adjustBrightness(colorB, -15)} 100%)`,
  };

  // ── Variant 1: Radial Burst (spotlight feel) ──
  const radialBg = {
    background: `radial-gradient(ellipse 70% 60% at ${radialX}% ${radialY}%, ${colorC} 0%, ${backgroundColor} 45%, ${colorB} 100%)`,
  };

  // ── Variant 2: Diagonal Sweep ──
  const diagonalBg = {
    background: `linear-gradient(${135 + sweepOffset}deg, ${colorB} 0%, ${backgroundColor} 40%, ${colorC} 70%, ${colorB} 100%)`,
  };

  const bgStyles = [linearBg, radialBg, diagonalBg];
  const bgStyle = bgStyles[gradientVariant];

  return (
    <AbsoluteFill>
      {/* Base gradient */}
      <AbsoluteFill style={bgStyle} />

      {/* Moving radial highlight — all variants get this */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 45% at ${radialX}% ${radialY}%, rgba(255,255,255,0.06) 0%, transparent 65%)`,
        }}
      />

      {/* Breathing vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${overlayOpacity}) 100%)`,
        }}
      />

      {/* Scanline texture */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.012) 3px, rgba(0,0,0,0.012) 4px)`,
        }}
      />
    </AbsoluteFill>
  );
};
