import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { TextAnimation } from './TextAnimation';
import type { Scene } from '../types';

export const IntroScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineWidth = spring({
    fps,
    frame,
    config: { damping: 200, stiffness: 60 },
    from: 0,
    to: 200,
    delay: 10,
  });

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
          gap: 30,
        }}
      >
        <TextAnimation
          text={scene.text}
          animation={scene.animation}
          color={scene.textColor}
          fontSize={scene.fontSize}
          delay={5}
        />

        <div
          style={{
            width: lineWidth,
            height: 4,
            backgroundColor: scene.textColor,
            borderRadius: 2,
            opacity: 0.6,
          }}
        />

        {scene.subtext && (
          <TextAnimation
            text={scene.subtext}
            animation="fade"
            color={scene.textColor}
            fontSize={Math.round(scene.fontSize * 0.45)}
            delay={20}
            fontWeight={400}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
