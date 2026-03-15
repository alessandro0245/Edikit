import React from 'react';
import { AbsoluteFill, Audio, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { wipe } from '@remotion/transitions/wipe';
import { fade } from '@remotion/transitions/fade';
import { flip } from '@remotion/transitions/flip';
import { slide } from '@remotion/transitions/slide';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { none } from '@remotion/transitions/none';
import { IntroScene } from '../components/IntroScene';
import { ContentScene } from '../components/ContentScene';
import { CTAScene } from '../components/CTAScene';
import { WatermarkLayer } from '../components/WatermarkLayer';
import { TransitionAudio } from '../components/Sceneaudio';
import type { VideoConfig, Scene, AudioConfig, MoodType, VideoAssets } from '../types';
import { DEFAULT_FPS, TRANSITION_FRAMES } from '../types';

type TransitionPresentation = ReturnType<typeof fade>;
type TimingFunction = Parameters<typeof TransitionSeries.Transition>[0]['timing'];

function getTransition(index: number, mood?: MoodType): TransitionPresentation {
  const energeticPool: TransitionPresentation[] = [
    slide({ direction: 'from-right' }), flip({ direction: 'from-right' }),
    wipe({ direction: 'from-left' }),   slide({ direction: 'from-left' }),
    flip({ direction: 'from-left' }),   none(),
    wipe({ direction: 'from-top' }),    none(),
  ];
  const cinematicPool: TransitionPresentation[] = [
    fade(), wipe({ direction: 'from-bottom' }), fade(),
    wipe({ direction: 'from-top' }), clockWipe({ direction: 'from-top-left' }),
    fade(), wipe({ direction: 'from-left' }), fade(),
  ];
  const corporatePool: TransitionPresentation[] = [
    wipe({ direction: 'from-left' }), slide({ direction: 'from-right' }),
    fade(), wipe({ direction: 'from-right' }), slide({ direction: 'from-left' }),
    fade(), wipe({ direction: 'from-left' }),
  ];
  const chillPool: TransitionPresentation[] = [
    fade(), clockWipe({ direction: 'from-top-left' }), fade(),
    wipe({ direction: 'from-bottom' }), fade(),
    clockWipe({ direction: 'from-top-right' }), fade(),
  ];
  const pool =
    mood === 'energetic' ? energeticPool
    : mood === 'cinematic' ? cinematicPool
    : mood === 'corporate' ? corporatePool
    : chillPool;
  return pool[index % pool.length];
}

function getTransitionFrames(mood?: MoodType): number {
  switch (mood) {
    case 'energetic': return 8;
    case 'cinematic': return 22;
    case 'corporate': return 14;
    case 'chill':     return 20;
    default:          return TRANSITION_FRAMES;
  }
}

function getTransitionTiming(mood: MoodType | undefined, frames: number): TimingFunction {
  if (mood === 'energetic') {
    return springTiming({ config: { damping: 200, stiffness: 120 }, durationInFrames: frames });
  }
  return linearTiming({ durationInFrames: frames });
}

const BackgroundMusic: React.FC<{ audio: AudioConfig; totalFrames: number }> = ({ audio, totalFrames }) => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [0, 20, totalFrames - 30, totalFrames],
    [0, audio.volume, audio.volume, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );
  const isExternal = audio.trackUrl.startsWith('http');
  return <Audio src={isExternal ? audio.trackUrl : staticFile(audio.trackUrl)} volume={volume} loop />;
};

const SceneRouter: React.FC<{
  scene:           Scene;
  sceneIndex:      number;
  audio?:          AudioConfig;
  assets?:         VideoAssets;
  previousBgColor?: string;
}> = ({ scene, sceneIndex, audio, assets, previousBgColor }) => {
  switch (scene.type) {
    case 'intro':
      return (
        <IntroScene
          scene={scene}
          sceneIndex={sceneIndex}
          audio={audio}
          logoUrl={assets?.logoUrl}
          bgImageUrl={assets?.bgImageUrl}
        />
      );
    case 'cta':
      return (
        <CTAScene
          scene={scene}
          sceneIndex={sceneIndex}
          audio={audio}
          previousBgColor={previousBgColor}
          logoUrl={assets?.logoUrl}
        />
      );
    case 'content':
    default:
      return <ContentScene scene={scene} sceneIndex={sceneIndex} audio={audio} />;
  }
};

export const AIVideoComposition: React.FC<Record<string, unknown>> = (props) => {
  const { scenes, fps = DEFAULT_FPS, audio, assets } = props as unknown as VideoConfig;
  const mood            = audio?.mood as MoodType | undefined;
  const transitionFrames = getTransitionFrames(mood);

  const totalFrames =
    scenes.reduce((sum, s) => sum + Math.ceil(s.duration * fps), 0) -
    Math.max(0, scenes.length - 1) * transitionFrames;

    
    return (
    <AbsoluteFill>
      {audio && <BackgroundMusic audio={audio} totalFrames={totalFrames} />}

      <TransitionSeries>
        {scenes.map((scene, index) => {
          const sceneDurationInFrames = Math.ceil(scene.duration * fps);
          const previousBgColor       = index > 0 ? scenes[index - 1].backgroundColor : undefined;
          const transitionIndex       = index - 1;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <TransitionSeries.Transition
                  presentation={getTransition(transitionIndex, mood)}
                  timing={getTransitionTiming(mood, transitionFrames)}
                />
              )}
              <TransitionSeries.Sequence durationInFrames={sceneDurationInFrames}>
                <>
                  <SceneRouter
                    scene={scene}
                    sceneIndex={index}
                    audio={audio}
                    assets={assets}
                    previousBgColor={previousBgColor}
                  />
                  {/* Watermark on every scene if uploaded */}
                  {assets?.watermarkUrl && (
                    <WatermarkLayer watermarkUrl={assets.watermarkUrl} />
                  )}
                  {index > 0 && audio && (
                    <TransitionAudio sfxVolume={audio.sfxVolume} transitionIndex={transitionIndex} />
                  )}
                </>
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};