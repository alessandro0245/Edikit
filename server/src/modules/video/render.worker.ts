import { workerData, parentPort } from 'worker_threads';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import * as path from 'path';
import * as fs from 'fs/promises';

async function run() {
  const { config, outputDir } = workerData as {
    config: Record<string, unknown>;
    outputDir: string;
    jobId: string;
  };

  // __dirname in dist = server/dist/src/modules/video
  // Up 4 levels = server root, then into remotion/src/index.ts
  const remotionEntry = path.join(
    __dirname,
    '../../../../remotion/src/index.ts',
  );

  parentPort!.postMessage({ type: 'progress', progress: 0.01 });

  const publicDir = path.join(
    __dirname,
    '../../../../remotion/public',
  );

  const bundleLocation = await bundle({
    entryPoint: remotionEntry,
    publicDir,
    onProgress: (p) => {
      parentPort!.postMessage({ type: 'progress', progress: (p / 100) * 0.15 });
    },
  });

  parentPort!.postMessage({ type: 'progress', progress: 0.15 });

  const compositionId = (config.compositionId as string) || 'AIVideoComposition';
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: config,
    timeoutInMilliseconds: 120000,
  });

  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.mp4`;
  const outputPath = path.join(outputDir, fileName);

  // Derive encoding settings from the composition type and resolution.
  // MatchCut uses rapid full-frame cuts with sharp text — high bitrate is
  // required to prevent blocking artifacts. BT.709 is mandatory for all HD
  // content so colours are interpreted correctly on every platform.
  const isMatchCut = compositionId === 'MatchCut';
  const is4k = isMatchCut && (config.resolution as string) === '4k';
  const videoBitrate = isMatchCut
    ? (is4k ? '40M' : '15M')
    : undefined; // let Remotion use CRF for other compositions

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    outputLocation: outputPath,
    inputProps: config,
    codec: 'h264',
    // CRF and videoBitrate are mutually exclusive in Remotion —
    // use bitrate-controlled mode for MatchCut, CRF for everything else.
    ...(videoBitrate ? { videoBitrate } : { crf: 20 }),
    // BT.709 is the standard colour space for all HD/4K video.
    // Without this tag, players and platform re-encoders misinterpret
    // the colour signal and the dark background + link colours shift.
    colorSpace: 'bt709',
    timeoutInMilliseconds: 120000,
    onProgress: ({ progress }: { progress: number }) => {
      parentPort!.postMessage({
        type: 'progress',
        progress: 0.15 + progress * 0.85,
      });
    },
  });

  parentPort!.postMessage({ type: 'done', outputPath });
}

run().catch((err) => {
  parentPort!.postMessage({
    type: 'error',
    message: String(err?.message ?? err),
  });
});
