import React from 'react';
import { AbsoluteFill, Img, Video, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const MediaLayer: React.FC<{ mediaUrl?: string, sceneIndex?: number }> = ({ mediaUrl, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!mediaUrl) return null;

  const isVideo = mediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i);

  // Smooth cinematic fade in
  const opacity = interpolate(frame, [0, fps], [0, 0.65], { extrapolateRight: 'clamp' }); 

  // Variety of cinematic camera moves across scenes to prevent repetition
  const moveType = sceneIndex % 4;

  let scale, translateX, translateY;
  
  // Note: Minimum scale is 1.15 so we have plenty of safe margin for translated panning without revealing black edges

  if (moveType === 0) {
    // Zoom in slowly, pan left
    scale = interpolate(frame, [0, durationInFrames], [1.15, 1.25], { extrapolateRight: 'clamp' });
    translateX = interpolate(frame, [0, durationInFrames], [10, -20]);
    translateY = interpolate(frame, [0, durationInFrames], [0, 0]);
  } else if (moveType === 1) {
    // Zoom out slowly, pan right up
    scale = interpolate(frame, [0, durationInFrames], [1.25, 1.15], { extrapolateRight: 'clamp' });
    translateX = interpolate(frame, [0, durationInFrames], [-20, 15]);
    translateY = interpolate(frame, [0, durationInFrames], [15, -10]);
  } else if (moveType === 2) {
    // Deep center push (no pan)
    scale = interpolate(frame, [0, durationInFrames], [1.15, 1.35], { extrapolateRight: 'clamp' });
    translateX = 0;
    translateY = 0;
  } else {
    // Static size, deep pan vertical
    scale = 1.2;
    translateX = interpolate(frame, [0, durationInFrames], [-10, 10]);
    translateY = interpolate(frame, [0, durationInFrames], [-25, 25]);
  }

  // Entrance RGB split effect for high-end feel
  const splitEndFrame = moveType === 2 ? fps * 2 : fps * 1.5; // Sometimes longer split
  const rgbIntensity = interpolate(frame, [0, splitEndFrame], [15, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ zIndex: 0, backgroundColor: '#000' }}>
      
      {/* Background bleed preventer - heavily blurred copy of itself behind everything */}
      <AbsoluteFill style={{ transform: 'scale(1.5)', filter: 'blur(40px)', opacity: 0.5 }}>
        {isVideo ? (
          <Video muted volume={0} src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Img src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </AbsoluteFill>

      {/* Red Channel */}
      <AbsoluteFill
        style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          opacity, mixBlendMode: 'screen',
          transform: `scale(${scale}) translate(${translateX - rgbIntensity}px, ${translateY}px)`,
          filter: 'sepia(100%) hue-rotate(-50deg) saturate(200%)',
          overflow: 'hidden'
        }}
      >
        {isVideo ? (
          <Video muted volume={0} src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Img src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </AbsoluteFill>

      {/* Blue/Cyan Channel */}
      <AbsoluteFill
        style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          opacity, mixBlendMode: 'screen',
          transform: `scale(${scale}) translate(${translateX + rgbIntensity}px, ${translateY}px)`,
          filter: 'sepia(100%) hue-rotate(150deg) saturate(200%)',
          overflow: 'hidden'
        }}
      >
        {isVideo ? (
          <Video muted volume={0} src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Img src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </AbsoluteFill>

      {/* Main Base Channel */}
      <AbsoluteFill
        style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          opacity, mixBlendMode: 'normal',
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          overflow: 'hidden'
        }}
      >
        {isVideo ? (
          <Video muted volume={0} src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Img src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </AbsoluteFill>

      {/* Lighting / Vignette Overlay */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        opacity: 0.9
      }} />
    </AbsoluteFill>
  );
};
