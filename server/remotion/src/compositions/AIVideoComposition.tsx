import React from 'react';
import { AbsoluteFill, Audio, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { wipe } from '@remotion/transitions/wipe';
import { fade } from '@remotion/transitions/fade';
import { flip } from '@remotion/transitions/flip';
import { slide } from '@remotion/transitions/slide';
import { IntroScene } from '../components/IntroScene';
import { ContentScene } from '../components/ContentScene';
import { CTAScene } from '../components/CTAScene';
import { getSfxUrl } from '../../../src/modules/freesounds/audio-config';
import type { VideoConfig, Scene, AudioConfig, MoodType } from '../types';
import { DEFAULT_FPS, TRANSITION_FRAMES } from '../types';

type TransitionPresentation = ReturnType<typeof fade>;

// Mood-weighted transitions — cinematic gets slow fades/wipes, energetic gets snappy flips/slides
function getTransition(index: number, mood?: MoodType): TransitionPresentation {
  const energeticTransitions: TransitionPresentation[] = [
    slide({ direction: 'from-right' }),
    flip({ direction: 'from-right' }),
    wipe({ direction: 'from-left' }),
    slide({ direction: 'from-left' }),
    flip({ direction: 'from-left' }),
    wipe({ direction: 'from-top' }),
  ];

  const cinematicTransitions: TransitionPresentation[] = [
    fade(),
    wipe({ direction: 'from-bottom' }),
    fade(),
    wipe({ direction: 'from-top' }),
    fade(),
    wipe({ direction: 'from-left' }),
  ];

  const corporateTransitions: TransitionPresentation[] = [
    fade(),
    slide({ direction: 'from-right' }),
    wipe({ direction: 'from-left' }),
    fade(),
    slide({ direction: 'from-left' }),
    fade(),
  ];

  const chillTransitions: TransitionPresentation[] = [
    fade(),
    fade(),
    wipe({ direction: 'from-bottom' }),
    fade(),
    wipe({ direction: 'from-top' }),
    fade(),
  ];

  const pool =
    mood === 'energetic' ? energeticTransitions
    : mood === 'cinematic' ? cinematicTransitions
    : mood === 'corporate' ? corporateTransitions
    : chillTransitions;

  return pool[index % pool.length];
}

// Transition speed — energetic = faster, cinematic = slower
function getTransitionFrames(mood?: MoodType): number {
  switch (mood) {
    case 'energetic': return 10;
    case 'cinematic': return 22;
    case 'corporate': return 15;
    case 'chill':     return 18;
    default:          return TRANSITION_FRAMES;
  }
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

const TransitionSwoosh: React.FC<{ sfxVolume: number }> = ({ sfxVolume }) => (
  <Audio src={staticFile(getSfxUrl('swoosh'))} startFrom={0} volume={sfxVolume} />
);

const SceneRouter: React.FC<{ scene: Scene; sceneIndex: number; audio?: AudioConfig; previousBgColor?: string }> = ({
  scene, sceneIndex, audio, previousBgColor,
}) => {
  switch (scene.type) {
    case 'intro':
      return <IntroScene scene={scene} sceneIndex={sceneIndex} audio={audio} />;
    case 'cta':
      return <CTAScene scene={scene} sceneIndex={sceneIndex} audio={audio} previousBgColor={previousBgColor} />;
    case 'content':
    default:
      return <ContentScene scene={scene} sceneIndex={sceneIndex} audio={audio} />;
  }
};

export const AIVideoComposition: React.FC<Record<string, unknown>> = (props) => {
  const { scenes, fps = DEFAULT_FPS, audio } = props as unknown as VideoConfig;
  const mood = audio?.mood as MoodType | undefined;
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
          const previousBgColor = index > 0 ? scenes[index - 1].backgroundColor : undefined;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <TransitionSeries.Transition
                  presentation={getTransition(index - 1, mood)}
                  timing={springTiming({
                    config: { damping: 200, stiffness: mood === 'energetic' ? 120 : 80 },
                    durationInFrames: transitionFrames,
                  })}
                />
              )}
              <TransitionSeries.Sequence durationInFrames={sceneDurationInFrames}>
                <>
                  <SceneRouter scene={scene} sceneIndex={index} audio={audio} previousBgColor={previousBgColor} />
                  {index > 0 && audio && <TransitionSwoosh sfxVolume={audio.sfxVolume} />}
                </>
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};