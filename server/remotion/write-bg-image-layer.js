const fs = require('fs');

const content = `import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface BgImageLayerProps {
  imageUrl: string;
  overlayOpacity?: number; // dark overlay on top of image for text readability
}

export const BgImageLayer: React.FC<BgImageLayerProps> = ({
  imageUrl,
  overlayOpacity = 0.55,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Deeper slow Ken Burns
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.08], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const panX = interpolate(frame, [0, durationInFrames], [0, -10], { extrapolateRight: 'clamp' });
  
  // Cinematic entrance fade
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  
  // Optional blur that comes into focus
  const blur = interpolate(frame, [0, fps], [8, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: '#050505' }}>
      
      {/* Heavy stylized background reflection */}
      <AbsoluteFill
        style={{
          transform: \`scale(1.2)\`,
          filter: \`blur(30px) saturate(1.5)\`,
          opacity: 0.6
        }}
      >
        <Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      {/* Main crisp image layer */}
      <AbsoluteFill
        style={{
          transform: \`scale(\${scale}) translateX(\${panX}px)\`,
          transformOrigin: 'center center',
          filter: \`blur(\${blur}px)\`,
          overflow: 'hidden',
        }}
      >
        <Img
          src={imageUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
      </AbsoluteFill>

      {/* Grid overlay for texture */}
      <AbsoluteFill
        style={{
          background: \`repeating-linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0) 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)\`,
        }}
      />

      {/* Dark overlay — ensures text always readable */}
      <AbsoluteFill style={{ backgroundColor: 'black', opacity: overlayOpacity }} />
    </AbsoluteFill>
  );
};
`;

fs.writeFileSync('src/components/BgImageLayer.tsx', content);
console.log('done');