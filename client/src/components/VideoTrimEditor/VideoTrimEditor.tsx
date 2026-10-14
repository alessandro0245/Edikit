"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Check,
  Scissors,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import {
  extractVideoThumbnails,
  trimVideo,
  formatTime,
} from "@/utils/videoTrim";

interface VideoTrimEditorProps {
  /** Original video File object */
  videoFile: File;
  /** Blob or object URL of the video for preview playback */
  videoUrl: string;
  /** Required slot duration in seconds (e.g. 5 or 6) */
  slotDuration: number;
  /** Total video duration in seconds */
  totalDuration: number;
  /** Optional label for the field */
  fieldLabel?: string;
  /** Called when user confirms trim; receives the selected startTime */
  onApply: (startTime: number) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

export default function VideoTrimEditor({
  videoFile,
  videoUrl,
  slotDuration,
  totalDuration,
  fieldLabel,
  onApply,
  onCancel,
}: VideoTrimEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Maximum start time so segment does not exceed total duration
  const maxStartTime = Math.max(0, totalDuration - slotDuration);

  // Current selected trim start time in seconds
  const [startTime, setStartTime] = useState(0);

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartTimeRef = useRef(0);

  // Filmstrip thumbnails
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(true);

  // Extract thumbnails on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingThumbnails(true);

    extractVideoThumbnails(videoFile, 10)
      .then((thumbs) => {
        if (!cancelled) {
          setThumbnails(thumbs);
          setLoadingThumbnails(false);
        }
      })
      .catch((err) => {
        console.error("Failed to extract thumbnails", err);
        if (!cancelled) setLoadingThumbnails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoFile]);

  // Synchronize video preview when scrubbing
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Update preview video element when startTime changes and not actively playing
  useEffect(() => {
    if (!isPlaying) {
      seekTo(startTime);
    }
  }, [startTime, isPlaying, seekTo]);

  // Handle video loop playback within [startTime, startTime + slotDuration]
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Loop back to startTime if we reached or exceeded the slot segment
    const segmentEnd = startTime + slotDuration;
    if (cur >= segmentEnd || cur < startTime) {
      videoRef.current.currentTime = startTime;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (
        videoRef.current.currentTime < startTime ||
        videoRef.current.currentTime >= startTime + slotDuration
      ) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // ── Dragging logic for the fixed-duration frame ──
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartTimeRef.current = startTime;

    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    if (trackRect.width <= 0) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const deltaSeconds = (deltaX / trackRect.width) * totalDuration;

    let newStart = dragStartTimeRef.current + deltaSeconds;
    newStart = Math.max(0, Math.min(newStart, maxStartTime));

    setStartTime(newStart);
    seekTo(newStart);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Clicking directly on the track timeline to jump frame
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const clickPercent = clickX / trackRect.width;
    const targetCenterTime = clickPercent * totalDuration;

    let newStart = targetCenterTime - slotDuration / 2;
    newStart = Math.max(0, Math.min(newStart, maxStartTime));
    setStartTime(newStart);
    seekTo(newStart);
  };

  const handleReset = () => {
    setStartTime(0);
    seekTo(0);
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleApplyTrim = () => {
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    onApply(startTime);
  };

  // Window geometry calculations
  const windowWidthPercent =
    totalDuration > 0
      ? Math.min(100, (slotDuration / totalDuration) * 100)
      : 100;
  const startPercent =
    totalDuration > 0 ? (startTime / totalDuration) * 100 : 0;
  const endPercent = Math.min(100, startPercent + windowWidthPercent);

  // Playhead position within the selection window
  const segmentProgressPercent =
    slotDuration > 0
      ? Math.max(0, Math.min(100, ((currentTime - startTime) / slotDuration) * 100))
      : 0;

  return (
    <div className="rounded-xl border border-border/80 bg-card text-foreground p-3 sm:p-3.5 shadow-sm overflow-hidden transition-all select-none">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
            This slot needs exactly {slotDuration} seconds
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            Drag the frame to choose which part of your video to use. The length is fixed.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            title="Reset trim position"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            title="Cancel"
            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Video Preview Player ── */}
      <div className="relative w-full max-h-36 sm:max-h-40 rounded-lg overflow-hidden bg-black/95 border border-border/60 flex items-center justify-center group mb-2.5 shadow-xs">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="max-h-36 sm:max-h-40 w-auto object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Video Overlay Controls */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              className="pointer-events-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 fill-white" />
            </button>
          )}
        </div>

        {/* Audio Mute & Segment Time Badge */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none px-0.5">
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="pointer-events-auto p-1 rounded bg-black/60 backdrop-blur-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </button>

          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-zinc-300 border border-white/10">
            {formatTime(currentTime)} / {formatTime(startTime + slotDuration)}
          </span>
        </div>
      </div>

      {/* ── Timeline Filmstrip & Fixed Drag Window ── */}
      <div className="space-y-1">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative w-full h-11 sm:h-12 rounded-lg bg-zinc-950 border border-border/70 overflow-hidden select-none touch-none cursor-pointer shadow-inner"
        >
          {/* Filmstrip Thumbnails */}
          <div className="absolute inset-0 flex w-full h-full">
            {thumbnails.length > 0 ? (
              thumbnails.map((thumb, idx) => (
                <div
                  key={idx}
                  className="relative flex-1 h-full overflow-hidden border-r border-black/30 last:border-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt={`Frame ${idx}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900/60 text-zinc-500 text-[11px] gap-1.5">
                {loadingThumbnails && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{loadingThumbnails ? "Loading frames..." : "Video timeline"}</span>
              </div>
            )}
          </div>

          {/* Dimmed Left Unselected Region */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-black/75 pointer-events-none transition-[width] duration-75"
            style={{ width: `${startPercent}%` }}
          />

          {/* Dimmed Right Unselected Region */}
          <div
            className="absolute top-0 bottom-0 right-0 bg-black/75 pointer-events-none transition-[width] duration-75"
            style={{ width: `${100 - endPercent}%` }}
          />

          {/* ── Fixed-Duration Selection Frame (Draggable Only) ── */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              left: `${startPercent}%`,
              width: `${windowWidthPercent}%`,
            }}
            className={`absolute top-0 bottom-0 rounded-lg border-2 border-primary bg-primary/10 shadow-[0_0_10px_rgba(37,99,235,0.35)] ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } z-20 flex items-center justify-between px-0.5`}
          >
            {/* Left Pill Handle */}
            <div className="w-1 h-3.5 rounded-full bg-white shadow-sm pointer-events-none shrink-0" />

            {/* Playhead Progress Bar inside selection window */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-xs pointer-events-none z-30"
                style={{ left: `${segmentProgressPercent}%` }}
              />
            )}

            {/* Right Pill Handle */}
            <div className="w-1 h-3.5 rounded-full bg-white shadow-sm pointer-events-none shrink-0" />
          </div>
        </div>

        {/* ── Timestamps (0:00 on left, Video 0:18.0 on right) ── */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground font-mono px-0.5">
          <span>{formatTime(startTime)}</span>
          <span>Video {formatTime(totalDuration, true)}</span>
        </div>
      </div>

      {/* ── Footer Action Bar ── */}
      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border/70">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Scissors className="w-3 h-3 text-primary" />
          <span>Lossless cut ({slotDuration}s)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyTrim}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-3 h-3 stroke-[2.5]" />
            <span>Apply Trim</span>
          </button>
        </div>
      </div>
    </div>
  );
}
