import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface BgImageLayerProps {
  imageUrl: string;
  overlayOpacity?: number; // dark overlay on top of image for text readability
}

export const BgImageLayer: React.FC<BgImageLayerProps> = ({
  imageUrl,
  overlayOpacity = 0.55, // default — keeps text readable over any image
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle Ken Burns — slow zoom over duration of scene
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.06], {
    extrapolateRight: 'clamp',
    extrapolateLeft:  'clamp',
  });

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft:  'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Image with Ken Burns zoom */}
      <AbsoluteFill
        style={{
          transform:      `scale(${scale})`,
          transformOrigin: 'center center',
          overflow:        'hidden',
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            objectPosition: 'center',
          }}
        />
      </AbsoluteFill>

      {/* Dark overlay — ensures text always readable */}
      <AbsoluteFill
        style={{
          background: `rgba(0,0,0,${overlayOpacity})`,
        }}
      />

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </AbsoluteFill>
);
};