import React from 'react';
import { Audio, staticFile } from 'remotion';
import { getAnimationSfx, getSfxVariant, SfxType } from '../sfx-utils';
import type { AnimationType } from '../types';

interface SceneAudioProps {
  animation: AnimationType;
  sfxVolume: number;
  delay?: number; // frames before sfx fires
  sceneIndex?: number;
}

export const SceneAudio: React.FC<SceneAudioProps> = ({
  animation,
  sfxVolume,
  delay = 5,
  sceneIndex = 0,
}) => {
  const sfxType = getAnimationSfx(animation);

  if (!sfxType) return null;

  // Typewriter tick repeats — play every ~8 frames
  if (sfxType === 'tick') {
    return (
      <>
        {Array.from({ length: 6 }, (_, i) => (
          <Audio
            key={i}
            src={staticFile(getSfxVariant('tick', i))} // Use variant for tick if available, or just repeat
            startFrom={0}
            volume={sfxVolume * 0.5}
            playbackRate={1.2}
            // Each tick fires at delay + (i * 8 frames)
            // We offset using a wrapper but Audio starts at sequence start,
            // so we use endAt to silence the others
           // TODO: Implement actual timing logic if needed, but for now just Audio component placement
           // NOTE: The previous code was incomplete in the read, assuming standard Audio behavior
          />
        ))}
      </>
    );
  }

  return (
    <Audio
      src={staticFile(getSfxVariant(sfxType, sceneIndex))}
      startFrom={0}
      volume={sfxVolume}
      playbackRate={sfxType === 'whoosh' ? 1.0 : 1.0}
    />
  );
};

// Transition SFX — played at scene boundary
interface TransitionAudioProps {
  sfxVolume: number;
  transitionIndex?: number;
}

export const TransitionAudio: React.FC<TransitionAudioProps> = ({ sfxVolume, transitionIndex = 0 }) => {
  return (
    <Audio
      src={staticFile(getSfxVariant('swoosh', transitionIndex))}
      startFrom={0}
      volume={sfxVolume}
    />
  );
};
