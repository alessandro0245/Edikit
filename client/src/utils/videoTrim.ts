import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg, acquireFFmpegLock } from "./videoResize";

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

/**
 * Extracts metadata (duration, width, height) from a video File.
 * Properly handles edge cases like Infinity duration in Chrome/Safari for certain containers.
 */
export const getVideoMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      let duration = video.duration;

      // Handle variable framerate / WebM / missing duration headers
      if (duration === Infinity || isNaN(duration)) {
        video.currentTime = 1e101;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          duration = video.duration;
          cleanup();
          resolve({
            duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };
        return;
      }

      cleanup();
      resolve({
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video metadata. Please select a valid video file."));
    };

    video.src = objectUrl;
  });
};

/**
 * Extracts a sequence of thumbnail frames across the duration of a video file
 * to create a filmstrip for the timeline scrubber.
 */
export const extractVideoThumbnails = async (
  file: File,
  count: number = 10
): Promise<string[]> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const thumbnails: string[] = [];

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || isNaN(duration) || duration === Infinity) {
        cleanup();
        resolve([]);
        return;
      }

      // Keep thumbnails compact for memory & speed (e.g. height 64px)
      const aspect = (video.videoWidth || 16) / (video.videoHeight || 9);
      const h = 64;
      const w = Math.round(h * aspect);
      canvas.width = w;
      canvas.height = h;

      const step = duration / Math.max(count, 1);
      const times: number[] = [];
      for (let i = 0; i < count; i++) {
        // Offset slightly into each slice to avoid blank first frames
        const t = Math.min(duration - 0.05, i * step + Math.min(0.1, step / 3));
        times.push(t);
      }

      for (const time of times) {
        try {
          await new Promise<void>((seekResolve) => {
            let settled = false;
            const onSeeked = () => {
              if (!settled) {
                settled = true;
                video.removeEventListener("seeked", onSeeked);
                seekResolve();
              }
            };
            video.addEventListener("seeked", onSeeked, { once: true });
            video.currentTime = time;
            setTimeout(() => {
              if (!settled) {
                settled = true;
                video.removeEventListener("seeked", onSeeked);
                seekResolve();
              }
            }, 350);
          });

          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            thumbnails.push(canvas.toDataURL("image/jpeg", 0.65));
          }
        } catch {
          // If seeking failed for a frame, continue
        }
      }

      cleanup();
      resolve(thumbnails);
    };

    video.onerror = () => {
      cleanup();
      resolve([]);
    };
  });
};

export interface TrimVideoOptions {
  onProgress?: (progress: number) => void;
  onQueued?: (queuePosition: number) => void;
  onStart?: () => void;
}

/**
 * Trims a video file starting at startTime for duration seconds.
 * Cuts WITHOUT re-encoding using FFmpeg stream copy (-c copy).
 */
export const trimVideo = async (
  file: File,
  startTime: number,
  duration: number,
  progressOrOptions?: ((progress: number) => void) | TrimVideoOptions,
  onQueuedParam?: (queuePosition: number) => void,
  onStartParam?: () => void
): Promise<File> => {
  let onProgress: ((progress: number) => void) | undefined;
  let onQueued: ((queuePosition: number) => void) | undefined = onQueuedParam;
  let onStart: (() => void) | undefined = onStartParam;

  if (typeof progressOrOptions === "function") {
    onProgress = progressOrOptions;
  } else if (progressOrOptions && typeof progressOrOptions === "object") {
    onProgress = progressOrOptions.onProgress;
    onQueued = progressOrOptions.onQueued;
    onStart = progressOrOptions.onStart;
  }

  const releaseLock = await acquireFFmpegLock(onQueued, onStart);

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

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const ext = rawExt === "mov" || rawExt === "mp4" ? rawExt : "mp4";
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const inputName = `trim_in_${uniqueId}.${ext}`;
    const outputName = `trim_out_${uniqueId}.mp4`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Lossless stream copy (-c copy): super fast, no quality loss, no re-encoding
      let copySuccessful = false;
      try {
        await ffmpeg.exec([
          "-ss", startTime.toFixed(3),
          "-i", inputName,
          "-t", duration.toFixed(3),
          "-map", "0:v:0",
          "-map", "0:a?",
          "-c", "copy",
          "-avoid_negative_ts", "make_zero",
          "-movflags", "+faststart",
          outputName,
        ]);
        copySuccessful = true;
      } catch (copyErr) {
        console.warn("FFmpeg stream copy failed, falling back to fast encode", copyErr);
      }

      // Fallback if container stream-copy failed for an unusual container/codec
      if (!copySuccessful) {
        await ffmpeg.exec([
          "-ss", startTime.toFixed(3),
          "-i", inputName,
          "-t", duration.toFixed(3),
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "18",
          "-c:a", "aac",
          "-b:a", "192k",
          "-movflags", "+faststart",
          outputName,
        ]);
      }

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^/.]+$/, "");

      return new File(
        [new Uint8Array(data as unknown as ArrayBuffer)],
        `${baseName}_trimmed.mp4`,
        {
          type: "video/mp4",
          lastModified: Date.now(),
        }
      );
    } finally {
      if (onProgress) {
        ffmpeg.off("progress", progressCallback);
      }
      try { await ffmpeg.deleteFile(inputName); } catch {}
      try { await ffmpeg.deleteFile(outputName); } catch {}
    }
  } finally {
    releaseLock();
  }
};

/**
 * Format seconds into M:SS or M:SS.S
 */
export const formatTime = (seconds: number, showTenths: boolean = false): string => {
  if (isNaN(seconds) || seconds < 0) return showTenths ? "0:00.0" : "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (showTenths) {
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${tenths}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
