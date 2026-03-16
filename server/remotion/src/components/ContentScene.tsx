import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { BgImageLayer } from './BgImageLayer';
import { MediaLayer } from './MediaLayer';
import { WordByWord } from './WordByWord';
import { ParticleLayer } from './ParticleLayer';
import { GrainOverlay } from './GrainOverlay';
import { SceneAudio } from './Sceneaudio';
import { LogoLayer } from './LogoLayer';
import type { Scene, AudioConfig } from '../types';

export const ContentScene: React.FC<{
  scene: Scene;
  sceneIndex?: number;
  audio?: AudioConfig;
  mediaUrl?: string;
  bgImageUrl?: string;
  logoUrl?: string;
}> = ({ scene, sceneIndex = 1, audio, mediaUrl, bgImageUrl, logoUrl }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isNarrow = width < height;

  const barWidth = spring({ fps, frame, config: { damping: 180, stiffness: 70 }, from: 0, to: 80, delay: 8 });
  const barOpacity = interpolate(frame, [8, 20], [0, 0.8], { extrapolateRight: 'clamp' });

  const patterns: Array<'cascade' | 'wave' | 'explosive'> = ['wave', 'cascade', 'explosive'];
  const staggerPattern = patterns[sceneIndex % patterns.length];

  const densities: Array<'low' | 'normal' | 'high'> = ['low', 'normal', 'low'];
  const density = densities[sceneIndex % densities.length];

  return (
    <AbsoluteFill>
      {bgImageUrl ? (
        <BgImageLayer imageUrl={bgImageUrl} />
      ) : (
        <BackgroundLayer
          backgroundColor={scene.backgroundColor}
          gradientVariant={((sceneIndex + 1) % 3) as 0 | 1 | 2}
        />
      )}
      <MediaLayer mediaUrl={mediaUrl} />
      <ParticleLayer color={scene.textColor} seed={sceneIndex * 17 + 3} density={density} />

      {logoUrl && (
        <LogoLayer
          logoUrl={logoUrl}
          position="top-left"
          size={isNarrow ? 80 : 120}
          delay={8}
          scene="content"
        />
      )}

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 140px', gap: 36 }}>
        <div style={{ width: barWidth, height: 4, backgroundColor: scene.textColor, borderRadius: 2, opacity: barOpacity, alignSelf: 'flex-start', marginLeft: '10%' }} />
        <WordByWord
          text={scene.text}
          animation={scene.animation}
          color={scene.textColor}
          fontSize={scene.fontSize}
          delay={5}
          staggerFrames={5}
          staggerPattern={staggerPattern}
        />
        {scene.subtext && (
          <WordByWord
            text={scene.subtext}
            animation="slide-up"
            color={scene.textColor}
            fontSize={Math.round(scene.fontSize * 0.5)}
            delay={18}
            fontWeight={400}
            staggerFrames={3}
            staggerPattern="cascade"
          />
        )}
      </AbsoluteFill>

      <GrainOverlay opacity={0.035} />
      {audio && <SceneAudio animation={scene.animation} sfxVolume={audio.sfxVolume} delay={5} />}
    </AbsoluteFill>
  );
};