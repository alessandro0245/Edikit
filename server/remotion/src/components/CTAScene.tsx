import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { TextAnimation } from './TextAnimation';
import type { Scene } from '../types';

export const CTAScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonScale = spring({
    fps,
    frame: Math.max(0, frame - 25),
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  const buttonOpacity = interpolate(frame, [20, 30], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const pulse =
    1 +
    Math.sin((frame - 40) * 0.08) * 0.02 * (frame > 40 ? 1 : 0);

  return (
    <AbsoluteFill>
      <BackgroundLayer backgroundColor={scene.backgroundColor} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 120px',
          gap: 40,
        }}
      >
        <TextAnimation
          text={scene.text}
          animation={scene.animation}
          color={scene.textColor}
          fontSize={scene.fontSize}
          delay={5}
        />

        {scene.subtext && (
          <div
            style={{
              opacity: buttonOpacity,
              transform: `scale(${buttonScale * pulse})`,
              padding: '20px 60px',
              borderRadius: 12,
              border: `3px solid ${scene.textColor}`,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <span
              style={{
                color: scene.textColor,
                fontSize: Math.round(scene.fontSize * 0.4),
                fontWeight: 600,
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {scene.subtext}
            </span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
