"use client";

import React, { useState, useRef } from "react";
import {
  Image, Upload, X, Loader2,
  ImagePlus, Layers, Stamp, ArrowRight, ChevronRight,
} from "lucide-react";
import api from "@/lib/auth";

export interface UploadedAssets {
  bgImageUrl?:   string;
  mediaUrls?:    string[];
}

interface AssetUploadStepProps {
  onComplete: (assets: UploadedAssets) => void;
}

type AssetType = "background" | "media";

interface AssetSlot {
  type:        AssetType;
  label:       string;
  description: string;
  hint:        string;
  icon:        React.ReactNode;
}

const ASSET_SLOTS: AssetSlot[] = [
  {
    type:        "background",
    label:       "Background Image",
    description: "Replaces solid color on intro scene",
    hint:        "Landscape photo or abstract texture",
    icon:        <Layers className="w-5 h-5" />,
  },
  {
    type:        "media",
    label:       "Video Media",
    description: "Any image or video overlay",
    hint:        "PNG, MP4, custom size",
    icon:        <ImagePlus className="w-5 h-5" />,
  },
];

// ─── Single upload zone ───────────────────────────────────────────────────────
const UploadZone: React.FC<{
  slot:       AssetSlot;
  urls:       string[];
  onUpload:   (type: AssetType, files: File[]) => Promise<void>;
  onRemove:   (type: AssetType, index?: number) => void;
  uploading:  boolean;
}> = ({ slot, urls, onUpload, onRemove, uploading }) => {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const isMedia = slot.type === 'media';

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return false;
    if (file.size > 5 * 1024 * 1024) return false;
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(handleFile);
    if (validFiles.length > 0) {
      onUpload(slot.type, validFiles);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{slot.icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{slot.label}</p>
            <p className="text-xs text-muted-foreground">{slot.description}</p>
          </div>
        </div>
        {isMedia && urls.length > 0 && (
          <button 
            type="button" 
            onClick={() => inputRef.current?.click()}
            className="text-xs text-primary hover:underline"
          >
            + Add more
          </button>
        )}
      </div>

      {urls.length > 0 ? (
        <div className="flex flex-col gap-2">
          {urls.map((url, i) => (
            // Preview state
            <div key={i} className="relative w-full h-28 rounded-xl overflow-hidden border border-border/60 bg-muted/20 group">
              {url.match(/\.(mp4|webm|mov).*$/i) ? (
                <video src={url} className="w-full h-full object-contain p-3" />
              ) : (
                <img src={url} alt={`${slot.label} ${i + 1}`} className="w-full h-full object-contain p-3" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onRemove(slot.type, isMedia ? i : undefined)}
                  className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-primary/90 text-primary-foreground text-[10px] font-mono px-1.5 py-0.5 rounded">
                ✓ Uploaded {isMedia ? `(Scene ${i + 1})` : ''}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Upload zone
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (isMedia) {
              handleFiles(e.dataTransfer.files);
            } else {
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }
          }}
          className={`
            relative w-full h-28 rounded-xl border-2 border-dashed
            flex flex-col items-center justify-center gap-2
            cursor-pointer transition-all duration-200
            ${drag
              ? "border-primary/60 bg-primary/5"
              : "border-border/40 hover:border-border/70 hover:bg-muted/20"
            }
          `}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/60 text-center px-4">
                Click or drag to upload
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/40">
                {slot.hint}
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple={isMedia}
        accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// ─── Main AssetUploadStep ─────────────────────────────────────────────────────
export const AssetUploadStep: React.FC<AssetUploadStepProps> = ({ onComplete }) => {
  const [assets, setAssets]           = useState<UploadedAssets>({});
  const [uploading, setUploading]     = useState<AssetType | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const uploadCount = Object.keys(assets).reduce((acc, key) => {
    const val = assets[key as keyof UploadedAssets];
    if (Array.isArray(val)) return acc + val.length;
    return val ? acc + 1 : acc;
  }, 0);

  const handleUpload = async (type: AssetType, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file",      file);
      formData.append("assetType", type);

      const { data } = await api.post("/assets/upload", formData, {
        headers:         { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (type === "media") {
        setAssets((prev) => ({
          ...prev,
          mediaUrls: [...(prev.mediaUrls || []), data.url],
        }));
      } else {
        setAssets((prev) => ({ ...prev, [`${type}Url`]: data.url }));
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleFilesArray = async (type: AssetType, files: File[]) => {
    try {
      setUploading(type);
      setError(null);
      await Promise.all(files.map((file) => handleUpload(type, file)));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Upload failed. Try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = (type: AssetType, index?: number) => {
    setAssets((prev) => {
      const next = { ...prev };
      if (type === 'media' && index !== undefined && next.mediaUrls) {
        next.mediaUrls = next.mediaUrls.filter((_, i) => i !== index);
      } else {
        delete next[`${type}Url` as keyof UploadedAssets];
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Add Your Assets
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — upload your brand assets to personalize the video.
        </p>
      </div>

      {/* Upload zones */}
      <div className="space-y-5">
        {ASSET_SLOTS.map((slot) => {
          const isMedia = slot.type === 'media';
          const urls = isMedia 
            ? (assets.mediaUrls || []) 
            : (assets[`${slot.type}Url` as keyof UploadedAssets] 
                ? [assets[`${slot.type}Url` as keyof UploadedAssets] as string] 
                : []);

          return (
            <UploadZone
              key={slot.type}
              slot={slot}
              urls={urls}
              onUpload={handleFilesArray}
              onRemove={handleRemove}
              uploading={uploading === slot.type}
            />
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* File size note */}
      <p className="text-[11px] font-mono text-muted-foreground/40 text-center">
        PNG, JPEG, WEBP, SVG · Max 5MB each
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onComplete({})}
          className="flex-1 py-3 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all cursor-pointer"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => onComplete(assets)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20"
        >
          {uploadCount > 0 ? `Continue with ${uploadCount} asset${uploadCount > 1 ? "s" : ""}` : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};