import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  shape: 'circle' | 'square' | 'triangle' | 'ring' | 'dot' | 'line';
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  opacity: number;
  delay: number;
  pulseSpeed: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateParticles(seed: number, count: number): Particle[] {
  const rand = seededRandom(seed);
  const shapes: Particle['shape'][] = ['circle', 'square', 'triangle', 'ring', 'dot', 'line'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand() * 110 - 5,
    y: rand() * 110 - 5,
    // More size variety — tiny dots to large shapes
    size: rand() < 0.4 ? 4 + rand() * 12 : rand() < 0.7 ? 14 + rand() * 28 : 32 + rand() * 50,
    shape: shapes[Math.floor(rand() * shapes.length)],
    speedX: (rand() - 0.5) * (0.008 + rand() * 0.018),
    speedY: (rand() - 0.5) * (0.008 + rand() * 0.018),
    rotationSpeed: (rand() - 0.5) * 0.6,
    opacity: 0.03 + rand() * 0.12,
    delay: Math.floor(rand() * 25),
    pulseSpeed: 0.02 + rand() * 0.05,
  }));
}

const Triangle: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <polygon points="50,5 95,95 5,95" fill="none" stroke={color} strokeWidth="5" />
  </svg>
);

const Ring: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="5" />
  </svg>
);

const Line: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size * 3} height={size * 0.3} viewBox="0 0 300 30">
    <line x1="0" y1="15" x2="300" y2="15" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

interface ParticleLayerProps {
  color: string;
  seed?: number;
  density?: 'low' | 'normal' | 'high';
}

export const ParticleLayer: React.FC<ParticleLayerProps> = ({
  color,
  seed = 42,
  density = 'normal',
}) => {
  const frame = useCurrentFrame();
  const count = density === 'low' ? 12 : density === 'high' ? 26 : 18;
  const particles = generateParticles(seed, count);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => {
        const adjustedFrame = Math.max(0, frame - p.delay);
        const x = ((p.x + p.speedX * adjustedFrame) % 115) - 5;
        const y = ((p.y + p.speedY * adjustedFrame) % 115) - 5;
        const rotation = p.rotationSpeed * adjustedFrame;

        // Opacity pulse for some particles
        const opacityPulse = p.opacity + Math.sin(adjustedFrame * p.pulseSpeed) * (p.opacity * 0.4);

        const fadeIn = interpolate(adjustedFrame, [0, 20], [0, 1], {
          extrapolateRight: 'clamp',
        });

        const finalOpacity = opacityPulse * fadeIn;

        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `rotate(${rotation}deg)`,
          opacity: finalOpacity,
        };

        switch (p.shape) {
          case 'circle':
            return <div key={p.id} style={{ ...style, width: p.size, height: p.size, borderRadius: '50%', backgroundColor: color }} />;
          case 'square':
            return <div key={p.id} style={{ ...style, width: p.size, height: p.size, backgroundColor: color }} />;
          case 'dot':
            return <div key={p.id} style={{ ...style, width: p.size * 0.3, height: p.size * 0.3, borderRadius: '50%', backgroundColor: color }} />;
          case 'triangle':
            return <div key={p.id} style={style}><Triangle size={p.size} color={color} /></div>;
          case 'ring':
            return <div key={p.id} style={style}><Ring size={p.size} color={color} /></div>;
          case 'line':
            return <div key={p.id} style={style}><Line size={p.size} color={color} /></div>;
        }
      })}
    </AbsoluteFill>
  );
};