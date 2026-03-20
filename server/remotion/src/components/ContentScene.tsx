import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BackgroundLayer } from './BackgroundLayer';
import { BgImageLayer } from './BgImageLayer';
import { MediaLayer } from './MediaLayer';
import { WordByWord } from './WordByWord';
import { ParticleLayer } from './ParticleLayer';
import { GrainOverlay } from './GrainOverlay';
import { SceneAudio } from './Sceneaudio';
import type { Scene, AudioConfig } from '../types';

export const ContentScene: React.FC<{
  scene: Scene;
  sceneIndex?: number;
  audio?: AudioConfig;
  mediaUrl?: string;
  bgImageUrl?: string;
}> = ({ scene, sceneIndex = 1, audio, mediaUrl, bgImageUrl }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isNarrow = width < height;

  const barWidth = spring({ fps, frame, config: { damping: 180, stiffness: 70 }, from: 0, to: 80, delay: 8 });
  const barOpacity = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: 'clamp' });
  const boxSlideY = spring({ fps, frame, config: { damping: 14, stiffness: 120, mass: 0.8 }, from: 50, to: 0, delay: 5 });

  const patterns: Array<'cascade' | 'wave' | 'explosive'> = ['wave', 'cascade', 'explosive'];
  const staggerPattern = patterns[sceneIndex % patterns.length];

  const densities: Array<'low' | 'normal' | 'high'> = ['low', 'normal', 'low'];
  const density = densities[sceneIndex % densities.length];

  // Pick 1-2 notable words to highlight (longer than 4 chars)
  const words = scene.text.split(' ');
  const highlightCandidateIndices = words
    .map((w, i) => (w.replace(/[^a-zA-Z]/g, '').length > 4 ? i : -1))
    .filter((i) => i !== -1)
    .sort((a, b) => {
      // Prefer words in the middle to create balance
      const distA = Math.abs(a - words.length / 2);
      const distB = Math.abs(b - words.length / 2);
      return distA - distB;
    });
  const highlightWordsToUse = highlightCandidateIndices.slice(0, 1 + (sceneIndex % 2));

  // Determine if this scene should use the "Live Karaoke" glowing trace effect
  // We'll apply it to every second content scene for variety
  const isKaraokeScene = sceneIndex % 2 === 1;

  return (
    <AbsoluteFill>
      {bgImageUrl ? (
        <BgImageLayer imageUrl={bgImageUrl} sceneIndex={sceneIndex} />
      ) : (
        <BackgroundLayer
          backgroundColor={scene.backgroundColor}
          gradientVariant={((sceneIndex + 1) % 3) as 0 | 1 | 2}
        />
      )}
      <MediaLayer mediaUrl={mediaUrl} sceneIndex={sceneIndex} />
      <ParticleLayer color={scene.textColor} seed={sceneIndex * 17 + 3} density={density} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 100px', gap: 36 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36,
          background: 'rgba(0, 0, 0, 0.25)', // Smooth glassy container
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '60px 80px',
          borderRadius: 32,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          opacity: barOpacity, // Tie it to the same entry fade
          transform: `translateY(${boxSlideY + Math.sin(frame / 25) * 6}px) rotate(${Math.sin(frame / 45) * 0.5}deg)`, // Glide in and ambient float
        }}>
          <div style={{ width: barWidth, height: 4, backgroundColor: scene.textColor, borderRadius: 2, alignSelf: 'flex-start' }} />
          <WordByWord
            text={scene.text}
            animation={scene.animation}
            color={scene.textColor}
            fontSize={scene.fontSize}
            delay={5}
            staggerFrames={isKaraokeScene ? Math.max(1, Math.floor(120 / scene.text.length)) : 6}
            staggerPattern={isKaraokeScene ? 'cascade' : staggerPattern}
            highlightWords={isKaraokeScene ? [] : highlightWordsToUse}
            highlightColor={scene.backgroundColor} // Invert it
            highlightBgColor={scene.textColor}
            liveKaraoke={isKaraokeScene}
            revealMode={isKaraokeScene ? 'letter' : 'word'}
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
        </div>
      </AbsoluteFill>

      <GrainOverlay opacity={0.035} />
      {audio && <SceneAudio animation={scene.animation} sfxVolume={audio.sfxVolume} delay={5} />}
    </AbsoluteFill>
  );
};