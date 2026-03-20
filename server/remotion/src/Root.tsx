import './index.css';
import { Composition } from 'remotion';
import { AIVideoComposition } from './compositions/AIVideoComposition';
import {
  DEFAULT_FPS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  getTotalDurationInFrames,
} from './types';
import type { VideoConfig } from './types';

const defaultProps: VideoConfig = {
  title: 'Edikit Demo — Option C',
  fps: DEFAULT_FPS,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  scenes: [
    {
      // ── KINETIC intro ──
      type: 'intro',
      text: 'AI VIDEO|CREATION',
      subtext: 'POWERED BY EDIKIT',
      backgroundColor: '#050505',
      textColor: '#7c3aed', // purple → block color
      animation: 'slide',
      duration: 2.5,
      fontSize: 92,
    },
    {
      // ── CLASSIC content ──
      type: 'content',
      text: 'Creating professional videos used to take weeks',
      subtext: 'Complex tools, expensive teams, endless revisions',
      backgroundColor: '#0d0520',
      textColor: '#ffffff',
      animation: 'slide-up',
      duration: 4,
      fontSize: 64,
    },
    {
      // ── CLASSIC content ──
      type: 'content',
      text: 'Just describe what you want in plain English',
      subtext: 'Our AI writes the script, designs every scene, picks the music',
      backgroundColor: '#1a0a35',
      textColor: '#ffffff',
      animation: 'typewriter',
      duration: 4.5,
      fontSize: 64,
    },
    {
      // ── CLASSIC content ──
      type: 'content',
      text: '20 premium color palettes, all contrast-verified',
      subtext: 'Energetic · Cinematic · Corporate · Chill',
      backgroundColor: '#0d0520',
      textColor: '#ffffff',
      animation: 'fade',
      duration: 3.5,
      fontSize: 64,
    },
    {
      // ── KINETIC CTA ──
      type: 'cta',
      text: 'START FREE|TODAY',
      subtext: 'EDIKIT.COM',
      backgroundColor: '#050505',
      textColor: '#ea580c', // orange → block color
      animation: 'scale',
      duration: 2.5,
      fontSize: 96,
    },
  ],
  // Audio disabled by default or use a valid local path if available
  // audio: {
  //   mood: 'cinematic',
  //   trackUrl: '', 
  //   volume: 0.35,
  //   sfxVolume: 0.55,
  //   trackIndex: 0,
  // },
};

export const RemotionRoot: React.FC = () => {
  const calcMetadata = async ({ props }: { props: VideoConfig }) => ({
    durationInFrames: getTotalDurationInFrames(props.scenes, props.fps),
    fps: props.fps,
    width: props.width,
    height: props.height,
  });

  return (
    <>
      <Composition
        id="AIVideoComposition"
        component={AIVideoComposition}
        durationInFrames={getTotalDurationInFrames(
          defaultProps.scenes,
          defaultProps.fps,
        )}
        fps={defaultProps.fps}
        width={defaultProps.width}
        height={defaultProps.height}
        defaultProps={defaultProps}
        calculateMetadata={calcMetadata as any}
      />
    </>
  );
};