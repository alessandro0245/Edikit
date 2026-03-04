import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import type { AnimationType } from '../types';

interface TextAnimationProps {
  text: string;
  animation: AnimationType;
  color: string;
  fontSize: number;
  delay?: number;
  fontWeight?: number;
}

export const TextAnimation: React.FC<TextAnimationProps> = ({
  text,
  animation,
  color,
  fontSize,
  delay = 0,
  fontWeight = 700,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const getAnimationStyle = (): React.CSSProperties => {
    switch (animation) {
      case 'fade': {
        const opacity = interpolate(adjustedFrame, [0, fps * 0.5], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return { opacity };
      }

      case 'scale': {
        const scale = spring({
          fps,
          frame: adjustedFrame,
          config: { damping: 200, stiffness: 100 },
        });
        const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return { transform: `scale(${scale})`, opacity };
      }

      case 'slide': {
        const translateX = spring({
          fps,
          frame: adjustedFrame,
          config: { damping: 200, stiffness: 80 },
          from: 80,
          to: 0,
        });
        const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return { transform: `translateX(${translateX}px)`, opacity };
      }

      case 'slide-up': {
        const translateY = spring({
          fps,
          frame: adjustedFrame,
          config: { damping: 200, stiffness: 80 },
          from: 60,
          to: 0,
        });
        const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return { transform: `translateY(${translateY}px)`, opacity };
      }

      case 'slide-down': {
        const translateY = spring({
          fps,
          frame: adjustedFrame,
          config: { damping: 200, stiffness: 80 },
          from: -60,
          to: 0,
        });
        const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return { transform: `translateY(${translateY}px)`, opacity };
      }

      case 'typewriter': {
        const charsToShow = Math.floor(
          interpolate(adjustedFrame, [0, text.length * 2], [0, text.length], {
            extrapolateRight: 'clamp',
          }),
        );
        return {
          clipPath: `inset(0 ${100 - (charsToShow / text.length) * 100}% 0 0)`,
        };
      }

      default:
        return { opacity: 1 };
    }
  };

  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
        lineHeight: 1.2,
        ...getAnimationStyle(),
      }}
    >
      {text}
    </div>
  );
};
