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
  title: 'Demo Video',
  fps: DEFAULT_FPS,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  scenes: [
    {
      type: 'intro',
      text: 'Welcome to Edikit',
      subtext: 'AI-Powered Video Generation',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      animation: 'scale',
      duration: 3,
      fontSize: 80,
    },
    {
      type: 'content',
      text: 'Create Videos with AI',
      subtext: 'Simply describe what you want and watch it come to life',
      backgroundColor: '#1e293b',
      textColor: '#e2e8f0',
      animation: 'slide',
      duration: 4,
      fontSize: 64,
    },
    {
      type: 'cta',
      text: 'Get Started Today',
      subtext: 'Try It Free',
      backgroundColor: '#7c3aed',
      textColor: '#ffffff',
      animation: 'fade',
      duration: 3,
      fontSize: 72,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  const calcMetadata = async ({
    props,
  }: {
    props: VideoConfig;
  }) => ({
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
