import React from 'react';
import { AbsoluteFill, Audio, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { none } from '@remotion/transitions/none';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { KineticScene } from '../components/KineticScene';
import { ContentScene } from '../components/ContentScene';
import { TransitionAudio } from '../components/Sceneaudio';
import type { VideoConfig, AudioConfig, MoodType } from '../types';
import { DEFAULT_FPS } from '../types';

// ─── Transition logic ─────────────────────────────────────────────────────────
// intro(kinetic) → content(classic): fast slide from right
// content → content: mood-based
// content → cta(kinetic): hard cut — sudden energy shift feels intentional

type TransitionPresentation = any;
type TimingFn = Parameters<typeof TransitionSeries.Transition>[0]['timing'];

function getTransition(
  fromType: string,
  toType: string,
  index: number,
  mood?: MoodType,
): { presentation: TransitionPresentation; timing: TimingFn } {
  // kinetic → classic: fast slide
  if (fromType === 'intro' && toType === 'content') {
    return {
      presentation: slide({ direction: 'from-right' }),
      timing: springTiming({ config: { damping: 200, stiffness: 120 }, durationInFrames: 10 }),
    };
  }

  // classic → kinetic (CTA): hard cut — punch
  if (toType === 'cta') {
    return {
      presentation: none(),
      timing: linearTiming({ durationInFrames: 2 }),
    };
  }

  // content → content: mood-based
  const frames = mood === 'energetic' ? 10
    : mood === 'cinematic' ? 20
    : mood === 'corporate' ? 14
    : 16;

  const presentations: Record<string, TransitionPresentation[]> = {
    energetic: [slide({ direction: 'from-right' }), wipe({ direction: 'from-left' }), slide({ direction: 'from-left' })],
    cinematic: [fade(), fade(), wipe({ direction: 'from-bottom' })],
    corporate: [wipe({ direction: 'from-left' }), fade(), slide({ direction: 'from-right' })],
    chill:     [fade(), fade(), wipe({ direction: 'from-bottom' })],
  };

  const pool = presentations[mood ?? 'chill'];
  return {
    presentation: pool[index % pool.length],
    timing: mood === 'energetic'
      ? springTiming({ config: { damping: 200, stiffness: 100 }, durationInFrames: frames })
      : linearTiming({ durationInFrames: frames }),
  };
}

// ─── Background music ─────────────────────────────────────────────────────────
const BackgroundMusic: React.FC<{ audio: AudioConfig; totalFrames: number }> = ({
  audio, totalFrames,
}) => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [0, 20, totalFrames - 30, totalFrames],
    [0, audio.volume, audio.volume, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );
  const isExternal = audio.trackUrl.startsWith('http');
  return (
    <Audio
      src={isExternal ? audio.trackUrl : staticFile(audio.trackUrl)}
      volume={volume}
      loop
    />
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const AIVideoComposition: React.FC<Record<string, unknown>> = (props) => {
  const { scenes, fps = DEFAULT_FPS, audio, assets } = props as unknown as VideoConfig;
  const mood = audio?.mood as MoodType | undefined;

  // Use a fixed transition frames for total duration calculation
  const avgTransitionFrames = 10;
  const totalFrames =
    scenes.reduce((sum, s) => sum + Math.ceil(s.duration * fps), 0) -
    Math.max(0, scenes.length - 1) * avgTransitionFrames;

  return (
    <AbsoluteFill>
      {audio && <BackgroundMusic audio={audio} totalFrames={totalFrames} />}

      <TransitionSeries>
        {scenes.map((scene, index) => {
          const sceneDurationInFrames = Math.ceil(scene.duration * fps);
          const prevScene             = index > 0 ? scenes[index - 1] : null;
          const fromType              = prevScene?.type ?? '';
          const toType                = scene.type;

          const transition = index > 0
            ? getTransition(fromType, toType, index - 1, mood)
            : null;

          return (
            <React.Fragment key={index}>
              {transition && (
                <TransitionSeries.Transition
                  presentation={transition.presentation}
                  timing={transition.timing}
                />
              )}

              <TransitionSeries.Sequence durationInFrames={sceneDurationInFrames}>
                <>
                  {/* ── Option C: kinetic for intro+cta, classic for content ── */}
                  {scene.type === 'content' ? (
                    <ContentScene
                      scene={scene}
                      sceneIndex={index}
                      audio={audio}
                      mediaUrl={scene.mediaUrl ?? (assets?.mediaUrls ? assets.mediaUrls[index % assets.mediaUrls.length] : undefined)}
                      bgImageUrl={assets?.bgImageUrl}
                    />
                  ) : (
                    <KineticScene
                      scene={scene}
                      sceneIndex={index}
                      audio={audio}
                      bgImageUrl={assets?.bgImageUrl}
                      mediaUrl={scene.mediaUrl ?? (assets?.mediaUrls ? assets.mediaUrls[index % assets.mediaUrls.length] : undefined)}
                    />
                  )}

                  {index > 0 && audio && (
                    <TransitionAudio
                      sfxVolume={
                        // quieter on hard cuts (kinetic transitions)
                        toType === 'cta' ? audio.sfxVolume * 0.3 : audio.sfxVolume
                      }
                      transitionIndex={index - 1}
                    />
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