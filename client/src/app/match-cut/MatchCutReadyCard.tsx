"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, ArrowDown, RotateCcw, Check } from "lucide-react";
import { AspectRatio, Resolution } from "./useMatchCutLogic";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";

interface MatchCutReadyCardProps {
  outputUrl: string;
  topic?: string;
  durationInSeconds?: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  onDownload: () => void;
  onRegenerate: () => void;
  onEditTopic?: () => void;
  isRegenerating?: boolean;
}

export default function MatchCutReadyCard({
  outputUrl,
  topic = "video",
  durationInSeconds = 7,
  aspectRatio,
  resolution,
  onDownload,
  onRegenerate,
  onEditTopic,
  isRegenerating = false,
}: MatchCutReadyCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationInSeconds);
  const [copied, setCopied] = useState(false);

  // Format time as m:ss
  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec < 0) return "0:00";
    const m = Math.floor(timeInSec / 60);
    const s = Math.floor(timeInSec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Seek on progress bar click
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * (videoRef.current.duration || duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Copy video link
  const handleCopyLink = async () => {
    if (!outputUrl) return;
    const fullUrl = outputUrl.startsWith("http")
      ? outputUrl
      : `${window.location.origin}${outputUrl}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      showSuccessToast("Link copied", "Video link copied to clipboard.");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      showErrorToast("Copy failed", "Could not copy link to clipboard.");
    }
  };

  // Update progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Aspect ratio wrapper class
  const aspectClass =
    aspectRatio === "9:16"
      ? "aspect-[9/16] max-h-[520px] mx-auto"
      : aspectRatio === "1:1"
      ? "aspect-square max-h-[460px] mx-auto"
      : "aspect-video w-full";

  return (
    <div className="w-full max-w-2xl rounded-[24px] border border-white/10 bg-[#121316] p-4 sm:p-5 md:p-6 shadow-2xl animate-in zoom-in-95 duration-300">
      {/* Top Header: • READY  |  0:07 · 16:9 · 4K */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: • READY */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#388BFD] shadow-[0_0_8px_#388BFD]" />
          <span className="text-xs sm:text-[13px] font-bold text-[#388BFD] uppercase tracking-widest">
            READY
          </span>
        </div>

        {/* Right: Metadata */}
        <div className="text-xs sm:text-[13px] font-medium text-zinc-400 font-mono tracking-tight">
          {formatTime(duration)} · {aspectRatio} · {resolution}
        </div>
      </div>

      {/* Center: Video Player Container */}
      <div
        className={`relative ${aspectClass} rounded-2xl overflow-hidden bg-black border border-white/10 group select-none`}
      >
        <video
          ref={videoRef}
          src={outputUrl}
          playsInline
          autoPlay
          loop
          muted={false}
          onClick={togglePlay}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current && videoRef.current.duration) {
              setDuration(videoRef.current.duration);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Custom Video Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-6 flex items-center gap-3 select-none">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="text-white hover:text-[#388BFD] transition-colors p-1 cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Scrubbable Progress Bar */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="relative flex-1 h-1.5 hover:h-2 bg-zinc-700/70 hover:bg-zinc-700 rounded-full cursor-pointer transition-all flex items-center"
          >
            <div
              className="h-full bg-[#388BFD] rounded-full relative"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Time Display: 0:02 / 0:07 */}
          <span className="text-[11px] sm:text-xs font-mono text-zinc-300 font-medium shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons: DOWNLOAD MP4 | COPY LINK | REGENERATE */}
      <div className="flex items-center gap-2.5 sm:gap-3 mt-4 sm:mt-5 w-full flex-wrap sm:flex-nowrap">
        {/* Primary Download Button */}
        <button
          type="button"
          onClick={onDownload}
          className="flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl bg-[#388BFD] hover:bg-[#2B79E4] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(56,139,253,0.35)] transition-all cursor-pointer min-w-[170px]"
        >
          <ArrowDown className="w-4 h-4 stroke-[3]" />
          <span>DOWNLOAD MP4</span>
        </button>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl bg-[#1A1C22] hover:bg-[#22252C] active:scale-[0.99] border border-white/10 text-white font-semibold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span className="text-emerald-400">COPIED</span>
            </>
          ) : (
            <span>COPY LINK</span>
          )}
        </button>

        {/* Regenerate Button */}
        <button
          type="button"
          disabled={isRegenerating}
          onClick={onRegenerate}
          className="py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl bg-[#1A1C22] hover:bg-[#22252C] active:scale-[0.99] border border-white/10 text-white font-semibold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`}
          />
          <span>REGENERATE</span>
        </button>
      </div>

      {/* Subtle Back / Edit Option */}
      {onEditTopic && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onEditTopic}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline cursor-pointer"
          >
            ← Change topic or settings
          </button>
        </div>
      )}
    </div>
  );
}
