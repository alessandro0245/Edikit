"use client";

import React, { useState, useRef } from "react";
import {
  Image, Upload, X, Loader2,
  ImagePlus, Layers, Stamp, ArrowRight, ChevronRight,
} from "lucide-react";
import api from "@/lib/auth";

export interface UploadedAssets {
  logoUrl?:      string;
  bgImageUrl?:   string;
  watermarkUrl?: string;
}

interface AssetUploadStepProps {
  onComplete: (assets: UploadedAssets) => void;
}

type AssetType = "logo" | "background" | "watermark";

interface AssetSlot {
  type:        AssetType;
  label:       string;
  description: string;
  hint:        string;
  icon:        React.ReactNode;
}

const ASSET_SLOTS: AssetSlot[] = [
  {
    type:        "logo",
    label:       "Logo",
    description: "Shown in intro & CTA scenes",
    hint:        "PNG with transparent bg works best",
    icon:        <ImagePlus className="w-5 h-5" />,
  },
  {
    type:        "background",
    label:       "Background Image",
    description: "Replaces solid color on intro scene",
    hint:        "Landscape photo or abstract texture",
    icon:        <Layers className="w-5 h-5" />,
  },
  {
    type:        "watermark",
    label:       "Watermark",
    description: "Subtle overlay on every scene",
    hint:        "PNG with transparent bg recommended",
    icon:        <Stamp className="w-5 h-5" />,
  },
];

// ─── Single upload zone ───────────────────────────────────────────────────────
const UploadZone: React.FC<{
  slot:       AssetSlot;
  url?:       string;
  onUpload:   (type: AssetType, file: File) => Promise<void>;
  onRemove:   (type: AssetType) => void;
  uploading:  boolean;
}> = ({ slot, url, onUpload, onRemove, uploading }) => {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    onUpload(slot.type, file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{slot.icon}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{slot.label}</p>
          <p className="text-xs text-muted-foreground">{slot.description}</p>
        </div>
      </div>

      {url ? (
        // Preview state
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border/60 bg-muted/20 group">
          <img src={url} alt={slot.label} className="w-full h-full object-contain p-3" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onRemove(slot.type)}
              className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="absolute bottom-2 right-2 bg-primary/90 text-primary-foreground text-[10px] font-mono px-1.5 py-0.5 rounded">
            ✓ Uploaded
          </div>
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
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
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
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
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

  const uploadCount = Object.values(assets).filter(Boolean).length;

  const handleUpload = async (type: AssetType, file: File) => {
    try {
      setUploading(type);
      setError(null);

      const formData = new FormData();
      formData.append("file",      file);
      formData.append("assetType", type);

      const { data } = await api.post("/assets/upload", formData, {
        headers:         { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setAssets((prev) => ({ ...prev, [`${type}Url`]: data.url }));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Upload failed. Try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = (type: AssetType) => {
    setAssets((prev) => {
      const next = { ...prev };
      delete next[`${type}Url` as keyof UploadedAssets];
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
        {ASSET_SLOTS.map((slot) => (
          <UploadZone
            key={slot.type}
            slot={slot}
            url={assets[`${slot.type}Url` as keyof UploadedAssets]}
            onUpload={handleUpload}
            onRemove={handleRemove}
            uploading={uploading === slot.type}
          />
        ))}
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