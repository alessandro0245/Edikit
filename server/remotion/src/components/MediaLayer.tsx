import React from 'react';
import { AbsoluteFill, Img, Video } from 'remotion';

export const MediaLayer: React.FC<{ mediaUrl?: string }> = ({ mediaUrl }) => {
  if (!mediaUrl) return null;

  const isVideo = mediaUrl.match(/\.(mp4|webm)$/i);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5, // keep it semi-transparent so text is readable
        zIndex: 0,
      }}
    >
      {isVideo ? (
        <Video
          src={mediaUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Img
          src={mediaUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </AbsoluteFill>
  );
};
