import { Template } from "./constant";

export interface UploadLimitResult {
  maxBytes: number;
  maxMB: number;
  durationSeconds: number;
  isVideo: boolean;
}

/**
 * Calculates the dynamic upload limit in bytes and MB based on template/slot duration.
 * Requirement: 20 MB per second of video slot.
 * Default video slot duration is 6 seconds (120 MB).
 * Non-video files (images) default to 50 MB.
 */
export const getUploadLimit = (
  file: File,
  template?: Template | null,
  fieldKey?: string
): UploadLimitResult => {
  const isVideo = file.type.startsWith("video/");

  if (isVideo) {
    const field = fieldKey && template?.fields ? template.fields[fieldKey] : undefined;
    const durationSeconds = field?.duration || template?.duration || 6;
    const maxMB = durationSeconds * 20;

    return {
      maxBytes: maxMB * 1024 * 1024,
      maxMB,
      durationSeconds,
      isVideo: true,
    };
  }

  // Images (PNG, JPG, WEBP, etc.)
  return {
    maxBytes: 50 * 1024 * 1024,
    maxMB: 50,
    durationSeconds: 0,
    isVideo: false,
  };
};
