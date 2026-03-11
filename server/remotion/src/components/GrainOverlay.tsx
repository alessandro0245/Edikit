import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const GrainOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.035 }) => {
  const frame = useCurrentFrame();
  // Shift the noise pattern every frame for animated grain
  const offset = (frame * 37) % 200;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ opacity, position: 'absolute' }}>
        <filter id={`grain-${frame % 4}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
            seed={offset}
          />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame % 4})`} />
      </svg>
    </AbsoluteFill>
  );
};
