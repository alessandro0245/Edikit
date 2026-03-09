import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { WordByWord } from './WordByWord';
import { ParticleLayer } from './ParticleLayer';
import { GrainOverlay } from './GrainOverlay';
import { SceneAudio } from './Sceneaudio';
import type { Scene, AudioConfig } from '../types';

export const IntroScene: React.FC<{
  scene: Scene;
  sceneIndex?: number;
  audio?: AudioConfig;
}> = ({ scene, sceneIndex = 0, audio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineWidth = spring({ fps, frame, config: { damping: 200, stiffness: 60 }, from: 0, to: 220, delay: 10 });
  const lineOpacity = interpolate(frame, [10, 25], [0, 0.7], { extrapolateRight: 'clamp' });
  const sceneScale = spring({ fps, frame, config: { damping: 200, stiffness: 40 }, from: 1.04, to: 1 });

  // Vary stagger pattern by sceneIndex
  const patterns: Array<'cascade' | 'wave' | 'explosive'> = ['cascade', 'wave', 'explosive'];
  const staggerPattern = patterns[sceneIndex % patterns.length];

  return (
    <AbsoluteFill style={{ transform: `scale(${sceneScale})` }}>
      <BackgroundLayer
        backgroundColor={scene.backgroundColor}
        accentColor={scene.textColor}
        gradientVariant={(sceneIndex % 3) as 0 | 1 | 2}
      />
      <ParticleLayer color={scene.textColor} seed={sceneIndex * 13 + 7} density="normal" />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 120px', gap: 30 }}>
        <WordByWord
          text={scene.text}
          animation={scene.animation}
          color={scene.textColor}
          fontSize={scene.fontSize}
          delay={5}
          staggerFrames={4}
          staggerPattern={staggerPattern}
        />
        <div style={{ width: lineWidth, height: 3, backgroundColor: scene.textColor, borderRadius: 2, opacity: lineOpacity }} />
        {scene.subtext && (
          <WordByWord
            text={scene.subtext}
            animation="fade"
            color={scene.textColor}
            fontSize={Math.round(scene.fontSize * 0.45)}
            delay={22}
            fontWeight={400}
            staggerFrames={3}
            staggerPattern="cascade"
          />
        )}
      </AbsoluteFill>

      <GrainOverlay opacity={0.04} />
      {audio && <SceneAudio animation={scene.animation} sfxVolume={audio.sfxVolume} delay={5} />}
    </AbsoluteFill>
  );
};