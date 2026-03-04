import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface BackgroundLayerProps {
  backgroundColor: string;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  backgroundColor,
}) => {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 300], [135, 225], {
    extrapolateRight: 'extend',
  });

  const isGradient = backgroundColor.includes(',');
  const bgStyle = isGradient
    ? { background: `linear-gradient(${gradientAngle}deg, ${backgroundColor})` }
    : { background: `linear-gradient(${gradientAngle}deg, ${backgroundColor}, ${adjustBrightness(backgroundColor, -20)})` };

  return (
    <AbsoluteFill
      style={{
        ...bgStyle,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

function adjustBrightness(hex: string, amount: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
