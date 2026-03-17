const fs = require('fs');

const content = `import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, interpolateColors } from 'remotion';
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
  highlightWords?: number[];
  highlightColor?: string;
  highlightBgColor?: string;
  liveKaraoke?: boolean;
  revealMode?: 'word' | 'letter';
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
  highlightWords = [],
  highlightColor = '#000000',
  highlightBgColor = '#ffffff',
  liveKaraoke = false,
  revealMode = 'word',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  const totalWords = words.length;
  const totalChars = words.reduce((acc, word) => acc + word.length, 0);
  const totalItems = revealMode === 'letter' ? totalChars : totalWords;

  // Stagger offset per pattern
  const getDelay = (i: number, total: number): number => {
    switch (staggerPattern) {
      case 'wave':
        return delay + Math.abs(i - Math.floor(total / 2)) * staggerFrames;
      case 'explosive':
        return delay + i * Math.max(1, Math.floor(staggerFrames * 0.4));
      case 'cascade':
      default:
        return delay + i * staggerFrames;
    }
  };

  const getStyle = (i: number, adjustedFrame: number, wordIndex: number): React.CSSProperties => {
    let wordStyle: React.CSSProperties = {};

    switch (animation) {
      case 'fade': {
        const opacity = interpolate(adjustedFrame, [0, fps * 0.4], [0, 1], { extrapolateRight: 'clamp' });
        wordStyle = { opacity };
        break;
      }
      case 'slide':
      case 'slide-up': {
        const fromY = staggerPattern === 'wave' && i % 2 === 0 ? -40 : 40;
        const translateY = spring({ fps, frame: adjustedFrame, config: { damping: 14, stiffness: 120, mass: 0.8 }, from: fromY, to: 0 });
        const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
        wordStyle = { transform: \`translateY(\${translateY}px)\`, opacity, display: 'inline-block' };
        break;
      }
      case 'slide-down': {
        const translateY = spring({ fps, frame: adjustedFrame, config: { damping: 14, stiffness: 120, mass: 0.8 }, from: -40, to: 0 });
        const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
        wordStyle = { transform: \`translateY(\${translateY}px)\`, opacity, display: 'inline-block' };
        break;
      }
      case 'scale': {
        const overshoot = staggerPattern === 'explosive' ? 1.3 : 1.0;
        const scale = spring({ fps, frame: adjustedFrame, config: { damping: staggerPattern === 'explosive' ? 8 : 10, stiffness: staggerPattern === 'explosive' ? 220 : 180, mass: 0.6 }, from: overshoot, to: 1 });
        const scaleFromZero = interpolate(adjustedFrame, [0, 4], [0, overshoot], { extrapolateRight: 'clamp' });
        const finalScale = adjustedFrame < 4 ? scaleFromZero : scale;
        const opacity = interpolate(adjustedFrame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
        wordStyle = { transform: \`scale(\${finalScale})\`, opacity, display: 'inline-block' };
        break;
      }
      case 'typewriter': {
        wordStyle = { opacity: adjustedFrame > 0 ? 1 : 0 };
        break;
      }
      default:
        wordStyle = { opacity: 1 };
    }

    const isStaticHighlighted = highlightWords.includes(wordIndex);
    let highlightPop = 0;
    let isActiveHighlight = false;

    const liveKaraokeHighlightProgress = liveKaraoke ? interpolate(adjustedFrame, [0, staggerFrames * 1.5, staggerFrames * 3.5], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;

    if (isStaticHighlighted) {
      isActiveHighlight = true;
      highlightPop = spring({ fps, frame: Math.max(0, frame - delay - wordIndex * staggerFrames), config: { damping: 12, stiffness: 180 }, from: 0, to: 1 });
    } else if (liveKaraoke && adjustedFrame >= 0 && liveKaraokeHighlightProgress > 0) {
      isActiveHighlight = true;
      highlightPop = liveKaraokeHighlightProgress;
    }

    if (isActiveHighlight) {
      const currentTextColor = isStaticHighlighted ? highlightColor : interpolateColors(highlightPop, [0, 0.5, 1], [color, highlightColor, highlightColor]);
      const currentBgColor = isStaticHighlighted && revealMode === 'word' ? highlightBgColor : interpolateColors(highlightPop, [0, 0.5, 1], ['rgba(0,0,0,0)', highlightBgColor, highlightBgColor]);

      // Apply pill shape only to word highlights, or adapt slightly for letter
      wordStyle = {
        ...wordStyle,
        color: currentTextColor,
        backgroundColor: revealMode === 'word' ? currentBgColor : 'transparent',
        padding: \`0 \${fontSize * 0.1 * highlightPop}px\`,
        borderRadius: \`\${fontSize * 0.15}px\`,
        boxShadow: revealMode === 'word' ? \`0 \${fontSize * 0.05 * highlightPop}px \${fontSize * 0.15 * highlightPop}px rgba(0,0,0,\${0.25 * highlightPop})\` : 'none',
        transform: \`\${wordStyle.transform || ''} scale(\${1 + (0.08 * highlightPop)}) rotate(\${(i % 2 === 0 ? -2 : 2) * highlightPop}deg)\`,
        display: 'inline-block',
        lineHeight: 1,
        margin: revealMode === 'word' ? \`0 \${fontSize * 0.05 * highlightPop}px\` : '0',
        textShadow: revealMode === 'letter' && isActiveHighlight && !isStaticHighlighted ? \`0 0 12px \${highlightColor}\` : 'none'
      };
    }

    return wordStyle;
  };

  let globalItemIndex = 0;

  return (
    <div
      style={{
        color, fontSize, fontWeight,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center', lineHeight: 1.25, display: 'flex', flexWrap: 'wrap',
        justifyContent: 'center', alignItems: 'center',
        gap: revealMode === 'word' ? \`0 \${fontSize * 0.28}px\` : \`0 \${fontSize * 0.2}px\`,
      }}
    >
      {words.map((word, wIdx) => {
        if (revealMode === 'letter') {
          const chars = word.split('');
          return (
            <span key={wIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap', ...(highlightWords.includes(wIdx) ? { backgroundColor: highlightBgColor, padding: \`0 \${fontSize * 0.1}px\`, borderRadius: \`\${fontSize * 0.15}px\` } : {}) }}>
              {chars.map((char, cIdx) => {
                const i = globalItemIndex++;
                const itemDelay = getDelay(i, totalItems);
                const adjustedFrame = Math.max(0, frame - itemDelay);
                const wordStyle = getStyle(i, adjustedFrame, wIdx);
                return <span key={cIdx} style={{ display: 'inline-block', ...wordStyle }}>{char}</span>;
              })}
              {wIdx < words.length - 1 && <span style={{ display: 'inline-block', width: \`\${fontSize * 0.28}px\` }} />}
            </span>
          );
        } else {
          const i = globalItemIndex++;
          const itemDelay = getDelay(i, totalItems);
          const adjustedFrame = Math.max(0, frame - itemDelay);
          const wordStyle = getStyle(i, adjustedFrame, wIdx);
          return (
            <span key={i} style={{ display: 'inline-block', ...wordStyle }}>
              {word}
            </span>
          );
        }
      })}
    </div>
  );
};
`;

fs.writeFileSync('src/components/WordByWord.tsx', content);
console.log('done');