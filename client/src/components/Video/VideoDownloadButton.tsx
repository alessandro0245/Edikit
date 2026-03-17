"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { downloadVideo } from "@/lib/videoDownload";
import { showInfoToast, showErrorToast } from "@/components/Toast/showToast";

interface VideoDownloadButtonProps {
  videoUrl?: string; // Optional if getDownloadUrl is provided
  getDownloadUrl?: () => Promise<string | null | undefined>; // For cases where we hit an API first
  filename?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
  onError?: (error: string) => void;
  tooltip?: string;
  disabled?: boolean;
}

type DownloadState =
  | "idle"
  | "preparing"
  | "downloading"
  | "finalizing"
  | "success"
  | "error";

export default function VideoDownloadButton({
  videoUrl: initialVideoUrl,
  getDownloadUrl,
  filename,
  variant = "primary",
  size = "md",
  className = "",
  showLabel = true,
  onError,
  tooltip,
  disabled = false,
}: VideoDownloadButtonProps) {
  const [state, setState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    if (state !== "idle" && state !== "error") return;

    setState("preparing");
    setProgress(0);

    try {
      // 1. Get URL if needed (This is the 4-5 second part)
      let url = initialVideoUrl;
      if (getDownloadUrl) {
        url = (await getDownloadUrl()) || "";
      }

      if (!url) {
        throw new Error("Could not retrieve download link");
      }

      // 2. Start Download
      setState("downloading");
      await downloadVideo(url, {
        filename,
        onProgress: (p) => {
          // Keep it at 99 max until finalizing
          setProgress(Math.min(p, 99));
        },
        onSuccess: () => {
          setState("finalizing");
          setProgress(100);
          setTimeout(() => {
            setState("success");
            showInfoToast("Video downloaded successfully!");
            setTimeout(() => setState("idle"), 3000);
          }, 800);
        },
        onError: (err) => {
          setState("error");
          showErrorToast(err);
          onError?.(err);
        },
      });
    } catch (error: unknown) {
      console.error("Download failed:", error);
      setState("error");
      const message =
        error instanceof Error ? error.message : "Failed to download video";
      showErrorToast(message);
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const sizeStyles = {
    sm: "h-9 px-3 text-sm gap-2",
    md: "h-11 px-5 text-sm gap-2.5",
    lg: "h-14 px-8 text-base gap-3",
  };

  const variantConfigs = {
    primary: {
      base: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95",
      progress: "bg-white/20",
      icon: "text-primary-foreground",
    },
    secondary: {
      base: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      progress: "bg-primary/20",
      icon: "text-secondary-foreground",
    },
    outline: {
      base: "border border-border bg-background text-foreground hover:bg-accent",
      progress: "bg-primary/10",
      icon: "text-foreground",
    },
  };

  const currentVariant = variantConfigs[variant];
  const isPending =
    state !== "idle" && state !== "success" && state !== "error";

  return (
    <div className={`relative group ${className}`}>
      <button
        onClick={handleDownload}
        disabled={isPending || disabled}
        title={tooltip}
        className={`
          relative w-full overflow-hidden inline-flex items-center justify-center rounded-xl font-semibold 
          transition-all duration-300 active:scale-[0.98] disabled:cursor-wait
          ${sizeStyles[size]} 
          ${state === "error" ? "bg-destructive text-destructive-foreground" : currentVariant.base}
          ${disabled && state === "idle" ? "opacity-50 cursor-not-allowed grayscale" : ""}
        `}
      >
        {/* Idle Shine Effect */}
        {state === "idle" && !disabled && (
          <div className="absolute inset-0 z-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
        )}

        {/* Progress Fill Background */}
        {isPending && (
          <div
            className={`absolute inset-y-0 left-0 transition-all duration-700 ease-in-out z-0 ${currentVariant.progress}`}
            style={{ width: `${state === "preparing" ? 25 : progress}%` }}
          />
        )}

        {/* Shimmer effect during download */}
        {state === "downloading" && (
          <div className="absolute inset-0 z-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center gap-2.5">
          {state === "idle" && (
            <>
              <Download className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              {showLabel && <span>Download Video</span>}
            </>
          )}

          {state === "preparing" && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white/80" />
              {showLabel && (
                <span className="animate-pulse flex items-center gap-1">
                  Preparing<span>...</span>
                </span>
              )}
            </>
          )}

          {state === "downloading" && (
            <div className="flex flex-col items-center gap-0.5">
              {showLabel && (
                <span className="text-sm font-bold tracking-tight">
                  Downloading {progress}%
                </span>
              )}
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-current animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {state === "finalizing" && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {showLabel && (
                <span className="animate-pulse">Wrapping up...</span>
              )}
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 className="w-5 h-5 text-white animate-[in_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]" />
              {showLabel && (
                <span className="animate-[in_0.4s_ease-out] font-bold">
                  Success!
                </span>
              )}
            </>
          )}

          {state === "error" && (
            <>
              <AlertCircle className="w-4 h-4 animate-bounce" />
              {showLabel && <span>Retry Download</span>}
            </>
          )}
        </div>
      </button>

      {/* Helper text for long downloads */}
      {isPending && (
        <div className="absolute -bottom-6 left-0 right-0 text-center animate-in fade-in slide-in-from-top-1">
          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
            {state === "preparing"
              ? "Establishing secure connection..."
              : state === "downloading"
                ? "Fetching data packets..."
                : "Saving to your device..."}
          </p>
        </div>
      )}
    </div>
  );
}
