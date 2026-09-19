"use client";

import { useRef, useState, useCallback } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check, X, RotateCcw } from "lucide-react";

interface ImageCropEditorProps {
  /** Object-URL or data-URL of the original image */
  src: string;
  /** Target width the crop should be output at (px) */
  targetWidth: number;
  /** Target height the crop should be output at (px) */
  targetHeight: number;
  /** Original File object — used to preserve mime type for the output */
  originalFile: File;
  /** Called when the user confirms the crop. Receives the new cropped File. */
  onApply: (croppedFile: File) => void;
  /** Called when the user cancels and wants to keep the previous state */
  onCancel: () => void;
  fieldLabel?: string;
}

/** Convert a PixelCrop + HTMLImageElement into a File at the target resolution */
async function cropToFile(
  image: HTMLImageElement,
  crop: PixelCrop,
  targetWidth: number,
  targetHeight: number,
  originalFile: File,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Account for device pixel ratio for crisp output
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob returned null"));
          return;
        }
        resolve(
          new File([blob], originalFile.name, {
            type: originalFile.type || "image/png",
            lastModified: Date.now(),
          }),
        );
      },
      originalFile.type || "image/png",
      1.0,
    );
  });
}

export default function ImageCropEditor({
  src,
  targetWidth,
  targetHeight,
  originalFile,
  onApply,
  onCancel,
  fieldLabel,
}: ImageCropEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const aspect = targetWidth / targetHeight;

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isApplying, setIsApplying] = useState(false);

  /** When the image loads, set a centred default crop */
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initialCrop = centerCrop(
        makeAspectCrop({ unit: "%", width: 100 }, aspect, width, height),
        width,
        height,
      );
      setCrop(initialCrop);
    },
    [aspect],
  );

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsApplying(true);
    try {
      const file = await cropToFile(
        imgRef.current,
        completedCrop,
        targetWidth,
        targetHeight,
        originalFile,
      );
      onApply(file);
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = useCallback(() => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    const resetCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 100 }, aspect, width, height),
      width,
      height,
    );
    setCrop(resetCrop);
    setCompletedCrop(undefined);
  }, [aspect]);

  return (
    <div className="rounded-xl border border-primary/40 bg-card overflow-hidden shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b border-primary/20">
        <span className="text-[11px] font-medium text-primary">
          Crop {fieldLabel ?? "image"} — drag to reposition
        </span>
        <div className="flex items-center gap-1">
          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset crop"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            title="Cancel"
            className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Crop canvas ── */}
      <div className="bg-checker flex items-center justify-center p-2 max-h-40 overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
          minWidth={20}
          minHeight={20}
          keepSelection
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/*
            IMPORTANT: No `object-contain` here.
            With object-contain the <img> CSS box is larger than the actual rendered
            pixels (letterboxing), so scaleX/scaleY in cropToFile are computed against
            the wrong dimensions and the crop is offset/truncated for images whose
            aspect ratio differs from the target slot. Without object-contain the
            element dimensions === actual rendered dimensions → correct scaling.
          */}
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            onLoad={onImageLoad}
            style={{ display: "block", maxHeight: "9rem", maxWidth: "100%" }}
            draggable={false}
          />
        </ReactCrop>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
        <span className="text-[10px] text-muted-foreground">
          {targetWidth} × {targetHeight}px output
        </span>
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplying || !completedCrop}
          className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isApplying ? (
            <span className="flex items-center gap-1">
              <svg
                className="animate-spin w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Applying…
            </span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              Apply Crop
            </>
          )}
        </button>
      </div>
    </div>
  );
}
