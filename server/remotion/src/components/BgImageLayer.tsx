import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, Video } from 'remotion';

interface BgImageLayerProps {
  imageUrl: string;
  overlayOpacity?: number; // dark overlay on top of image for text readability
  sceneIndex?: number;
}

export const BgImageLayer: React.FC<BgImageLayerProps> = ({
  imageUrl,
  overlayOpacity = 0.65,
  sceneIndex = 0,
}) => {
  const frame = useCurrentFrame();
  const isVideo = imageUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i);
  const { durationInFrames, fps } = useVideoConfig();

  // Pick a distinct camera movement per scene
  const cameraMove = sceneIndex % 3;
  let scale, panX, panY;

  if (cameraMove === 0) {
    // Push in heavily, slow pan right
    scale = interpolate(frame, [0, durationInFrames], [1.15, 1.3], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    panX = interpolate(frame, [0, durationInFrames], [10, -10], { extrapolateRight: 'clamp' });
    panY = 0;
  } else if (cameraMove === 1) {
    // Pull out gently, subtle pan up
    scale = interpolate(frame, [0, durationInFrames], [1.25, 1.15], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    panX = 0;
    panY = interpolate(frame, [0, durationInFrames], [15, -15], { extrapolateRight: 'clamp' });
  } else {
    // Deep static scale, diagonal pan
    scale = 1.25;
    panX = interpolate(frame, [0, durationInFrames], [-20, 20], { extrapolateRight: 'clamp' });
    panY = interpolate(frame, [0, durationInFrames], [-20, 15], { extrapolateRight: 'clamp' });
  }

  // Cinematic entrance fade
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  
  // Optional blur that comes into focus
  // Alternate scenes have deeper initial blur focus pulls
  const initialBlur = cameraMove === 2 ? 15 : 8;
  const blur = interpolate(frame, [0, fps * 1.5], [initialBlur, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: '#050505' }}>
      
      {/* Heavy stylized background reflection to prevent edge bleed entirely */}
      <AbsoluteFill
        style={{
          transform: `scale(1.5)`,
          filter: `blur(40px) saturate(1.5)`,
          opacity: 0.6
        }}
      >
        {isVideo ? (
          <Video muted volume={0} src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </AbsoluteFill>

      {/* Main crisp image layer */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center',
          filter: `blur(${blur}px)`,
          overflow: 'hidden',
        }}
      >
        {isVideo ? (
          <Video
            muted
            volume={0}
            src={imageUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        ) : (
          <Img
            src={imageUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        )}
      </AbsoluteFill>

      {/* Cinematic Color Grade / Wash */}
      <AbsoluteFill
        style={{
          backgroundColor: cameraMove === 1 ? 'rgba(20,0,40,0.1)' : 'rgba(40,20,0,0.1)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Grid overlay for texture */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0) 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`,
        }}
      />

      {/* Deep vignette + Dark overlay — ensures text always readable */}
      <AbsoluteFill style={{ 
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)',
        backgroundColor: `rgba(0,0,0,${overlayOpacity * 0.4})` 
      }} />
    </AbsoluteFill>
  );
};
