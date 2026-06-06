import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// ── Single instance outside the function ──
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

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
  const ffmpeg = await getFFmpeg();

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const inputName = `input_${Date.now()}.mp4`;
  const outputName = `output_${Date.now()}.mp4`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i", inputName,
      "-vf", `scale=w=${targetWidth}:h=${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`,
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
    // Always cleanup even if error occurs
    try { await ffmpeg.deleteFile(inputName); } catch {}
    try { await ffmpeg.deleteFile(outputName); } catch {}
  }
};