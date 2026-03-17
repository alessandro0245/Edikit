"use client";

import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
  Film,
  SlidersHorizontal,
  ImagePlus,
  Layers,
  Stamp,
  Upload,
  Sparkles,
  ChevronRight,
  CirclePlus,
  CircleX,
} from "lucide-react";
import { usePromptLogic } from "./usePromptLogic";
import VideoPlayer from "@/components/Video/VideoPlayer";
import VideoDownloadButton from "@/components/Video/VideoDownloadButton";
import {
  VideoSettingsModal,
  countChanges,
} from "@/components/VideoSettingsModal/VideoSettingsModal";
import { useRef, useMemo, useState, useEffect, useLayoutEffect } from "react";
import api from "@/lib/auth";
import type { UploadedAssets } from "@/components/Home/AssetUploadStep";
import { SceneAssignmentCanvas } from "./SceneAssignmentCanvas";

// ─── Types ────────────────────────────────────────────────────────────────────
type AssetType = "logo" | "background" | "watermark" | "media";

interface AssetSlotConfig {
  type: AssetType;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const ASSET_SLOTS: AssetSlotConfig[] = [
  {
    type: "logo",
    label: "Logo",
    hint: "PNG with transparent bg",
    icon: <ImagePlus className="w-4 h-4" />,
  },
  {
    type: "background",
    label: "Background Image",
    hint: "Replaces intro scene bg",
    icon: <Layers className="w-4 h-4" />,
  },
  {
    type: "watermark",
    label: "Watermark",
    hint: "Subtle corner overlay",
    icon: <Stamp className="w-4 h-4" />,
  },
  {
    type: "media",
    label: "Custom Media",
    hint: "Any image or video overlay",
    icon: <ImagePlus className="w-4 h-4" />,
  },
];

const ASSET_KEY_MAP: Record<AssetType, keyof UploadedAssets> = {
  logo: "logoUrl",
  background: "bgImageUrl",
  watermark: "watermarkUrl",
  media: "mediaUrls" as any,
};
// ─── Asset Upload Step ────────────────────────────────────────────────────────
function AssetUploadStep({
  onComplete,
}: {
  onComplete: (assets: UploadedAssets) => void;
}) {
  const [assets, setAssets] = useState<UploadedAssets>({});
  const [uploading, setUploading] = useState<AssetType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadCount = Object.keys(assets).reduce((acc, key) => {
    const val = assets[key as keyof UploadedAssets];
    if (Array.isArray(val)) return acc + val.length;
    return val ? acc + 1 : acc;
  }, 0);

  const handleUpload = async (type: AssetType, file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      throw new Error("Media only — PNG, JPEG, WEBP, SVG, MP4, WEBM");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File too large. Max 5MB.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", type);
    const { data } = await api.post("/assets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    if (type === "media") {
      setAssets((prev) => ({
        ...prev,
        mediaUrls: [...(prev.mediaUrls || []), data.url],
      }));
    } else {
      setAssets((prev) => ({ ...prev, [ASSET_KEY_MAP[type]]: data.url }));
    }
  };

  const handleFilesArray = async (
    type: AssetType,
    files: FileList | File[],
  ) => {
    setUploading(type);
    setError(null);
    try {
      if (type === "media") {
        // Run concurrent uploads logic internally within the same lifecycle bound
        await Promise.all(Array.from(files).map((f) => handleUpload(type, f)));
      } else {
        // Single file
        await handleUpload(type, Array.from(files)[0]);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Upload failed. Try again.",
      );
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
            Step 1 of 2
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Brand Assets
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload your assets to personalize the video. All fields are optional.
        </p>
      </div>

      {/* Upload slots */}
      <div className="space-y-3">
        {ASSET_SLOTS.map((slot) => {
          const key = ASSET_KEY_MAP[slot.type] as keyof UploadedAssets;
          const isMedia = slot.type === "media";
          const urls = isMedia
            ? assets.mediaUrls || []
            : assets[key]
              ? [assets[key] as string]
              : [];
          const isActive = uploading === slot.type;

          return (
            <div key={slot.type} className="space-y-2">
              <input
                ref={(el) => {
                  inputRefs.current[slot.type] = el;
                }}
                type="file"
                multiple={isMedia}
                accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesArray(slot.type, e.target.files);
                  }
                  e.target.value = "";
                }}
              />

              {urls.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {slot.label}
                    </span>
                    {isMedia && (
                      <button
                        type="button"
                        onClick={() => inputRefs.current[slot.type]?.click()}
                        className="text-xs text-primary hover:underline"
                      >
                        + Add more
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {urls.map((url, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl group"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/40 border border-border/40 shrink-0 flex items-center justify-center">
                          {url.match(/\.(mp4|webm|mov).*$/i) ? (
                            <video
                              src={url}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <img
                              src={url}
                              alt={slot.label}
                              className="w-full h-full object-contain p-1"
                            />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {isMedia ? `Media ${i + 1}` : slot.label}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            <span className="text-[11px] font-mono text-primary">
                              Uploaded
                            </span>
                          </div>
                        </div>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() =>
                            setAssets((prev) => {
                              const n = { ...prev };
                              if (isMedia && n.mediaUrls) {
                                n.mediaUrls = n.mediaUrls.filter(
                                  (_, index) => index !== i,
                                );
                              } else {
                                delete n[key];
                              }
                              return n;
                            })
                          }
                          className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // ── Upload zone ──
                <button
                  type="button"
                  onClick={() => inputRefs.current[slot.type]?.click()}
                  disabled={isActive}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl border border-dashed border-border/50 hover:border-border hover:bg-muted/20 transition-all duration-200 cursor-pointer group text-left disabled:cursor-wait"
                >
                  {/* Icon box */}
                  <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-border transition-colors shrink-0">
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      slot.icon
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {slot.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">
                      {slot.hint}
                    </p>
                  </div>
                  {/* Arrow */}
                  <Upload className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* File note */}
      <p className="text-[10px] font-mono text-muted-foreground/35 text-center tracking-wider uppercase">
        PNG · JPEG · WEBP · SVG · Max 5MB
      </p>

      {/* Actions */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => onComplete({})}
          className="px-5 py-3 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all cursor-pointer"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => onComplete(assets)}
          className="group flex-1 relative overflow-hidden flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          {uploadCount > 0 ? (
            <>
              <Sparkles className="w-4 h-4" />
              Continue with {uploadCount} asset{uploadCount > 1 ? "s" : ""}
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({
  steps,
  progress,
  progressStep,
}: {
  steps: { label: string; key: string }[];
  progress: number;
  progressStep: string;
}) {
  const thresholds = [15, 85, 100];
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const isComplete = progress >= thresholds[i];
        const isActive = progress >= thresholds[i] * 0.5 && !isComplete;
        const isFailed = progressStep === "error";
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500
              ${
                isFailed
                  ? "bg-red-500/20 border border-red-500/40"
                  : isComplete
                    ? "bg-primary border border-primary"
                    : isActive
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-muted border border-border"
              }`}
            >
              {isFailed ? (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              ) : isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              ) : isActive ? (
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </div>
            <span
              className={`text-sm transition-colors duration-300
              ${
                isFailed
                  ? "text-red-400"
                  : isComplete
                    ? "text-foreground font-medium"
                    : isActive
                      ? "text-foreground/80"
                      : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {isActive && !isFailed && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({
  progress,
  isError,
}: {
  progress: number;
  isError: boolean;
}) {
  return (
    <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${isError ? "bg-red-500" : "bg-primary"}`}
        style={{ width: `${isError ? 100 : progress}%` }}
      />
    </div>
  );
}

function EmptyCanvas() {
  return (
    <div className="w-full max-w-4xl aspect-video relative overflow-hidden rounded-xl border border-border/50 bg-[#080808]">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center">
          <Film className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">
            Your video will appear here
          </p>
          <p className="text-xs text-muted-foreground/50">
            Fill in the prompt and hit Generate
          </p>
        </div>
        {[
          ["top-4 left-4", "border-t border-l"],
          ["top-4 right-4", "border-t border-r"],
          ["bottom-4 left-4", "border-b border-l"],
          ["bottom-4 right-4", "border-b border-r"],
        ].map(([pos, border], i) => (
          <div
            key={i}
            className={`absolute ${pos} w-5 h-5 ${border} border-border/30`}
          />
        ))}
      </div>
    </div>
  );
}

function ProcessingCanvas({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-4xl aspect-video relative overflow-hidden rounded-xl border border-primary/20 bg-[#080808]">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse ${40 + progress * 0.3}% 40% at 50% 50%, hsl(var(--primary)/0.08), transparent)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-mono font-bold text-primary tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Rendering your video...
        </p>
      </div>
    </div>
  );
}

function ErrorCanvas({ message }: { message: string | null }) {
  return (
    <div className="w-full max-w-4xl aspect-video relative overflow-hidden rounded-xl border border-red-500/20 bg-[#0d0505]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-red-400">Generation Failed</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            {message ?? "An error occurred."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt Step ──────────────────────────────────────────────────────────────
function PromptStep({
  prompt,
  setPrompt,
  assets,
  settings,
  setSettings,
  settingsOpen,
  setSettingsOpen,
  isLoggedIn,
  authLoading,
  isSubmitting,
  canRender,
  changeCount,
  onSubmit,
  onBack,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  assets: UploadedAssets;
  settings: any;
  setSettings: (s: any) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  isLoggedIn: boolean;
  authLoading: boolean;
  isSubmitting: boolean;
  canRender: boolean | null | undefined;
  changeCount: number;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const uploadCount = Object.keys(assets).reduce((acc, key) => {
    const val = assets[key as keyof UploadedAssets];
    if (Array.isArray(val)) return acc + val.length;
    return val ? acc + 1 : acc;
  }, 0);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Header with step indicator */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer uppercase tracking-[0.2em]"
          >
            ← Step 1
          </button>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
              Step 2 of 2
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Your Prompt
        </h2>
      </div>

      {/* Asset summary — show uploaded assets as small chips */}
      {uploadCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assets.logoUrl && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/8 border border-primary/20 rounded-lg">
              <ImagePlus className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-mono text-primary">Logo</span>
            </div>
          )}
          {assets.bgImageUrl && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/8 border border-primary/20 rounded-lg">
              <Layers className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-mono text-primary">
                Background
              </span>
            </div>
          )}
          {assets.watermarkUrl && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/8 border border-primary/20 rounded-lg">
              <Stamp className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-mono text-primary">
                Watermark
              </span>
            </div>
          )}
          {assets.mediaUrls && assets.mediaUrls.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/8 border border-primary/20 rounded-lg">
              <Film className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-mono text-primary">
                {assets.mediaUrls.length} Media
              </span>
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="space-y-2">
        <label
          htmlFor="prompt"
          className="text-xs font-semibold text-foreground uppercase tracking-widest"
        >
          Describe Your Video
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              const el = textareaRef.current;
              if (el) {
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }
            }}
            placeholder="Describe your video — content, mood, style, tone..."
            minLength={10}
            maxLength={500}
            className="w-full min-h-36 px-4 py-3.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/60 resize-none transition-all leading-relaxed overflow-y-hidden"
          />
          <span
            className={`absolute bottom-3 right-3.5 text-[10px] font-mono tabular-nums transition-colors ${prompt.length > 450 ? "text-red-400" : "text-muted-foreground/40"}`}
          >
            {prompt.length}/500
          </span>
        </div>
        {prompt.length > 0 && prompt.length < 10 && (
          <p className="text-[11px] text-muted-foreground">
            {10 - prompt.length} more characters needed
          </p>
        )}
      </div>

      {/* Credits warning */}
      {isLoggedIn && canRender === false && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 leading-relaxed">
            Not enough credits.{" "}
            <a
              href="/pricing"
              className="underline underline-offset-2 font-medium"
            >
              Get more →
            </a>
          </p>
        </div>
      )}

      {/* Action row */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={`relative flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer shrink-0
            ${
              changeCount > 0
                ? "border-primary/50 bg-primary/8 text-primary hover:bg-primary/12"
                : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40"
            }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Customize</span>
          {changeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm shadow-primary/30">
              {changeCount}
            </span>
          )}
        </button>

        <button
          type="submit"
          disabled={
            prompt.trim().length < 10 ||
            authLoading ||
            !isLoggedIn ||
            isSubmitting ||
            canRender === false
          }
          className="group flex-1 relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary/20 cursor-pointer"
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          {authLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : !isLoggedIn ? (
            <>
              Login to Generate
              <ArrowRight className="w-4 h-4" />
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PromptPage() {
  const {
    categoryId,
    pageStep,
    assets,
    handleAssetsComplete,
    prompt,
    setPrompt,
    settings,
    setSettings,
    settingsOpen,
    setSettingsOpen,
    progressStep,
    progress,
    sidebarOpen,
    setSidebarOpen,
    isLoggedIn,
    authLoading,
    steps,
    outputUrl,
    errorMessage,
    isSubmitting,
    canRender,
    handleSubmit,
    handleReset,
    handleDownload,
    setPageStep,
    handleStartRender,
    generatedScenes,
    setGeneratedScenes,
  } = usePromptLogic();

  // Scroll to top on mount
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  const isIdle = progressStep === "idle";
  const isProcessing = progressStep === "processing";
  const isSceneAssignment = progressStep === "scene-assignment";
  const isComplete = progressStep === "complete";
  const isError = progressStep === "error";
  const changeCount = countChanges(settings);

  const [downloadError, setDownloadError] = useState(false);
  const downloadFilename = useMemo(
    () => `edikit-${categoryId}-${Date.now()}.mp4`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outputUrl, categoryId],
  );

  const handleResetAndScroll = () => {
    handleReset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight">
            Create Video
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
            {categoryId.replace(/-/g, " ")}
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          {sidebarOpen ? (
            <CircleX className="w-5 h-5" />
          ) : (
            <CirclePlus className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "flex" : "hidden"} lg:flex w-full lg:w-100 xl:w-110 flex-col bg-card border-b lg:border-b-0 lg:border-r border-border lg:h-screen lg:sticky lg:top-0`}
      >
        {/* Desktop header */}
        <div className="hidden lg:flex flex-col px-8 pt-10 pb-7 border-b border-border gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Create Video
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {categoryId.replace(/-/g, " ")}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* ── STEP 1: Asset Upload ── */}
          {isIdle && pageStep === "assets" && (
            <AssetUploadStep onComplete={handleAssetsComplete} />
          )}

          {/* ── STEP 2: Prompt ── */}
          {isIdle && pageStep === "prompt" && (
            <PromptStep
              prompt={prompt}
              setPrompt={setPrompt}
              assets={assets}
              settings={settings}
              setSettings={setSettings}
              settingsOpen={settingsOpen}
              setSettingsOpen={setSettingsOpen}
              isLoggedIn={isLoggedIn}
              authLoading={authLoading}
              isSubmitting={isSubmitting}
              canRender={canRender}
              changeCount={changeCount}
              onSubmit={handleSubmit}
              onBack={() => setPageStep("assets")}
            />
          )}

          {/* ── Processing / Complete / Error ── */}
          {!isIdle && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    {isError ? "Failed" : isComplete ? "Complete" : "Rendering"}
                  </span>
                  <span
                    className={`text-xs font-mono tabular-nums ${isError ? "text-red-400" : isComplete ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {isError ? "—" : `${Math.round(progress)}%`}
                  </span>
                </div>
                <ProgressBar progress={progress} isError={isError} />
              </div>

              <StepIndicator
                steps={steps}
                progress={progress}
                progressStep={progressStep}
              />

              {isError && errorMessage && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1">
                  <p className="text-xs font-medium text-red-400">
                    {errorMessage}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Credits have been refunded.
                  </p>
                </div>
              )}

              <div className="p-4 bg-background/60 border border-border/60 rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                  Prompt
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
                  {prompt}
                </p>
              </div>

              {(isComplete || isError) && (
                <button
                  onClick={handleResetAndScroll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/70 text-foreground text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  {isError ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try Again
                    </>
                  ) : (
                    "Create Another Video"
                  )}
                </button>
              )}

              {isComplete && (
                <VideoDownloadButton
                  getDownloadUrl={handleDownload}
                  filename={downloadFilename}
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  onError={() => setDownloadError(true)}
                  tooltip={
                    downloadError
                      ? "Link expired. Please refresh."
                      : "Download your video"
                  }
                  disabled={downloadError}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground text-center font-mono">
            {isIdle && pageStep === "assets"
              ? "All assets optional — skip to continue"
              : isIdle
                ? "5 credits per generation"
                : isError
                  ? "Credits refunded on failure"
                  : isComplete
                    ? "✓ Video ready to download"
                    : "Processing — please wait..."}
          </p>
        </div>
      </aside>

      {/* Main canvas */}
      <main className="flex-1 flex flex-col items-center justify-start py-6 px-4 lg:p-14 gap-6 h-fit md:min-h-[90vh] lg:min-h-screen">
        {isComplete && outputUrl ? (
          <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-border/40 ">
            <VideoPlayer
              src={outputUrl}
              autoPlay
              showDownload={false}
              className="w-full"
            />
          </div>
        ) : isSceneAssignment ? (
          <SceneAssignmentCanvas
            scenes={generatedScenes}
            uploadedAssets={assets}
            onConfirm={handleStartRender}
          />
        ) : isProcessing ? (
          <ProcessingCanvas progress={progress} />
        ) : isError ? (
          <ErrorCanvas message={errorMessage} />
        ) : (
          <EmptyCanvas />
        )}

        {isIdle && (
          <p className="text-[11px] font-mono text-muted-foreground/40 uppercase tracking-widest">
            {categoryId.replace(/-/g, " ")} · Edikit AI
          </p>
        )}
      </main>

      {/* Settings Modal */}
      <VideoSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
      />
    </div>
  );
}
