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

  const bundleLocation = await bundle({
    entryPoint: remotionEntry,
    onProgress: (p) => {
      parentPort!.postMessage({ type: 'progress', progress: (p / 100) * 0.15 });
    },
  });

  parentPort!.postMessage({ type: 'progress', progress: 0.15 });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'AIVideoComposition',
    inputProps: config,
  });

  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.mp4`;
  const outputPath = path.join(outputDir, fileName);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    outputLocation: outputPath,
    inputProps: config,
    codec: 'h264',
    crf: 20,
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
