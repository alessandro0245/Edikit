import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { AnimationType } from '../types';

type StaggerPattern = 'cascade' | 'wave' | 'explosive';

interface WordByWordProps {
  text: string;
  animation: AnimationType;
  color: string;
  fontSize: number;
  delay?: number;
  fontWeight?: number;
  staggerFrames?: number;
  staggerPattern?: StaggerPattern;
}

export const WordByWord: React.FC<WordByWordProps> = ({
  text,
  animation,
  color,
  fontSize,
  delay = 0,
  fontWeight = 700,
  staggerFrames = 5,
  staggerPattern = 'cascade',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  // ── Stagger offset per pattern ──
  const getWordDelay = (i: number, total: number): number => {
    switch (staggerPattern) {
      case 'wave':
        // Middle words appear first, edges last
        return delay + Math.abs(i - Math.floor(total / 2)) * staggerFrames;
      case 'explosive':
        // All words appear nearly simultaneously with tiny offset
        return delay + i * Math.max(1, Math.floor(staggerFrames * 0.4));
      case 'cascade':
      default:
        // Left to right sequential
        return delay + i * staggerFrames;
    }
  };

  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
        lineHeight: 1.25,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: `0 ${fontSize * 0.28}px`,
      }}
    >
      {words.map((word, i) => {
        const wordDelay = getWordDelay(i, words.length);
        const adjustedFrame = Math.max(0, frame - wordDelay);
        let wordStyle: React.CSSProperties = {};

        switch (animation) {
          case 'fade': {
            const opacity = interpolate(adjustedFrame, [0, fps * 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            });
            wordStyle = { opacity };
            break;
          }
          case 'slide':
          case 'slide-up': {
            // Wave pattern gets Y from both directions alternating
            const fromY = staggerPattern === 'wave' && i % 2 === 0 ? -40 : 40;
            const translateY = spring({
              fps,
              frame: adjustedFrame,
              config: { damping: 14, stiffness: 120, mass: 0.8 },
              from: fromY,
              to: 0,
            });
            const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], {
              extrapolateRight: 'clamp',
            });
            wordStyle = { transform: `translateY(${translateY}px)`, opacity, display: 'inline-block' };
            break;
          }
          case 'slide-down': {
            const translateY = spring({
              fps,
              frame: adjustedFrame,
              config: { damping: 14, stiffness: 120, mass: 0.8 },
              from: -40,
              to: 0,
            });
            const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], {
              extrapolateRight: 'clamp',
            });
            wordStyle = { transform: `translateY(${translateY}px)`, opacity, display: 'inline-block' };
            break;
          }
          case 'scale': {
            // Explosive: overshoot scale for drama
            const overshoot = staggerPattern === 'explosive' ? 1.3 : 1.0;
            const scale = spring({
              fps,
              frame: adjustedFrame,
              config: {
                damping: staggerPattern === 'explosive' ? 8 : 10,
                stiffness: staggerPattern === 'explosive' ? 220 : 180,
                mass: 0.6,
              },
              from: overshoot,
              to: 1,
            });
            const scaleFromZero = interpolate(adjustedFrame, [0, 4], [0, overshoot], {
              extrapolateRight: 'clamp',
            });
            const finalScale = adjustedFrame < 4 ? scaleFromZero : scale;
            const opacity = interpolate(adjustedFrame, [0, 5], [0, 1], {
              extrapolateRight: 'clamp',
            });
            wordStyle = { transform: `scale(${finalScale})`, opacity, display: 'inline-block' };
            break;
          }
          case 'typewriter': {
            wordStyle = { opacity: adjustedFrame > 0 ? 1 : 0 };
            break;
          }
          default:
            wordStyle = { opacity: 1 };
        }

        return (
          <span key={i} style={{ display: 'inline-block', ...wordStyle }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};