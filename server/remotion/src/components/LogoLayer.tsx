import React from 'react';
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface LogoLayerProps {
  logoUrl: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top';
  size?: number;      // px — logo max dimension
  delay?: number;     // frames before logo animates in
  scene?: 'intro' | 'cta' | 'content';
}

export const LogoLayer: React.FC<LogoLayerProps> = ({
  logoUrl,
  position = 'top-left',
  size = 120,
  delay = 8,
  scene = 'intro',
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Spring entrance
  const scale = spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: {
      damping:   scene === 'intro' ? 14 : 20,
      stiffness: scene === 'intro' ? 100 : 140,
      mass:      0.8,
    },
    from: 0,
    to:   1,
  });

  const opacity = interpolate(
    frame,
    [delay, delay + 10],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );

  // Position mapping — relative to canvas size for ratio-safe placement
  const padding = Math.round(width * 0.04); // 4% of width

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left':     { top: padding,            left: padding            },
    'top-right':    { top: padding,            right: padding           },
    'bottom-left':  { bottom: padding,         left: padding            },
    'bottom-right': { bottom: padding,         right: padding           },
    'center-top':   { top: padding,            left: '50%', transform: `translateX(-50%) scale(${scale})` },
  };

  const posStyle = positionStyles[position] ?? positionStyles['top-left'];

  // For center-top the transform is already included above
  const transformStyle = position === 'center-top'
    ? {}
    : { transform: `scale(${scale})` };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position:        'absolute',
          opacity,
          transformOrigin: position.includes('right') ? 'top right'
            : position === 'center-top'               ? 'top center'
            : 'top left',
          ...posStyle,
          ...transformStyle,
        }}
      >
        <Img
          src={logoUrl}
          style={{
            width:     size,
            height:    size,
            objectFit: 'contain',
            // Drop shadow for visibility on any bg
            filter:    'drop-shadow(0px 2px 8px rgba(0,0,0,0.4))',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};