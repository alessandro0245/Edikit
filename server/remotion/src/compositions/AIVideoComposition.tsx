import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { IntroScene } from '../components/IntroScene';
import { ContentScene } from '../components/ContentScene';
import { CTAScene } from '../components/CTAScene';
import type { VideoConfig, Scene } from '../types';
import { DEFAULT_FPS, TRANSITION_FRAMES } from '../types';

const SceneRouter: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case 'intro':
      return <IntroScene scene={scene} />;
    case 'cta':
      return <CTAScene scene={scene} />;
    case 'content':
    default:
      return <ContentScene scene={scene} />;
  }
};

export const AIVideoComposition: React.FC<Record<string, unknown>> = (
  props,
) => {
  const { scenes, fps = DEFAULT_FPS } = props as unknown as VideoConfig;

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {scenes.map((scene, index) => {
          const sceneDurationInFrames = Math.ceil(scene.duration * fps);
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={springTiming({
                    config: { damping: 200, stiffness: 80 },
                    durationInFrames: TRANSITION_FRAMES,
                  })}
                />
              )}
              <TransitionSeries.Sequence durationInFrames={sceneDurationInFrames}>
                <SceneRouter scene={scene} />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
