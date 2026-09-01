import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// ── Single instance outside the function ──
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;
let isProcessing = false;
const queue: (() => void)[] = [];

const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance && ffmpegLoaded) return ffmpegInstance;

  ffmpegInstance = new FFmpeg();
  ffmpegInstance.on("log", ({ message }) => {
    console.log("[FFmpeg Log]", message);
  });

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegLoaded = true;
  return ffmpegInstance;
};

export const resizeVideo = async (
  file: File,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (progress: number) => void
): Promise<File> => {
  await new Promise<void>((resolve) => {
    if (!isProcessing) {
      isProcessing = true;
      resolve();
    } else {
      queue.push(resolve);
    }
  });

  try {
    const ffmpeg = await getFFmpeg();

    const progressCallback = ({ progress }: { progress: number }) => {
      if (onProgress && typeof progress === "number") {
        let percentage = progress > 1 ? progress : Math.round(progress * 100);
        percentage = Math.max(0, Math.min(100, percentage));
        if (!isNaN(percentage)) {
          onProgress(percentage);
        }
      }
    };

    if (onProgress) {
      ffmpeg.on("progress", progressCallback);
    }

    const inputName = `input_${Date.now()}.mp4`;
    const outputName = `output_${Date.now()}.mp4`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const scaledWidth = Math.round((targetWidth * 1.03) / 2) * 2;
      const scaledHeight = Math.round((targetHeight * 1.03) / 2) * 2;

      await ffmpeg.exec([
        "-i", inputName,
        "-vf", `scale=w=${scaledWidth}:h=${scaledHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-c:a", "aac",        // ← changed from copy to aac for compatibility
        "-b:a", "128k",
        "-movflags", "+faststart",  // ← better for web playback
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);

      return new File([new Uint8Array(data as unknown as ArrayBuffer)], file.name, {
        type: "video/mp4",
        lastModified: Date.now(),
      });

    } finally {
      if (onProgress) {
        ffmpeg.off("progress", progressCallback);
      }
      // Always cleanup even if error occurs
      try { await ffmpeg.deleteFile(inputName); } catch {}
      try { await ffmpeg.deleteFile(outputName); } catch {}
    }
  } finally {
    if (queue.length > 0) {
      const next = queue.shift();
      if (next) next();
    } else {
      isProcessing = false;
    }
  }
};