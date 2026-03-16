import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';

interface WatermarkLayerProps {
  watermarkUrl: string;
  corner?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  opacity?: number;  // 0-1, default 0.35 — subtle
  size?: number;     // px
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({
  watermarkUrl,
  corner = 'bottom-right',
  opacity = 0.35,
  size = 80,
}) => {
  const frame = useCurrentFrame();

  // Gentle fade in — watermark doesn't need a dramatic entrance
  const alpha = interpolate(frame, [0, 15], [0, opacity], {
    extrapolateRight: 'clamp',
    extrapolateLeft:  'clamp',
  });

  const padding = 32;

  const cornerStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: padding, right: padding },
    'bottom-left':  { bottom: padding, left: padding  },
    'top-right':    { top: padding,    right: padding  },
    'top-left':     { top: padding,    left: padding   },
  };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 9999 }}>
      <div
        style={{
          position: 'absolute',
          opacity:  alpha,
          ...cornerStyles[corner],
        }}
      >
        <Img
          src={watermarkUrl}
          style={{
            width:     size,
            height:    size,
            objectFit: 'contain',
            // Desaturate slightly — watermarks should be unobtrusive
            filter:    'drop-shadow(0px 1px 4px rgba(0,0,0,0.5))',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};