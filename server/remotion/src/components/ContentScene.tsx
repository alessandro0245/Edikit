import React from 'react';
import {
  AbsoluteFill,
} from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { TextAnimation } from './TextAnimation';
import type { Scene } from '../types';

export const ContentScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  return (
    <AbsoluteFill>
      <BackgroundLayer backgroundColor={scene.backgroundColor} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 140px',
          gap: 36,
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
          <TextAnimation
            text={scene.subtext}
            animation="slide-up"
            color={scene.textColor}
            fontSize={Math.round(scene.fontSize * 0.5)}
            delay={18}
            fontWeight={400}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
