"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import VideoDownloadButton from "./VideoDownloadButton";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  showDownload?: boolean;
  downloadFilename?: string;
  className?: string;
  aspectRatio?: "video" | "portrait" | "square" | "thumbnail" | "none";
  variant?: "full" | "minimal";
  showFullscreen?: boolean;
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  controls = true,
  loop = true,
  muted = false,
  showDownload = true,
  downloadFilename,
  className = "",
  aspectRatio = "video",
  variant = "full",
  showFullscreen = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isMinimal = variant === "minimal";

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleReset = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      await document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const aspectRatioClasses = {
    video: "aspect-video",
    portrait: "aspect-[9/16]",
    square: "aspect-square",
    thumbnail: "aspect-[16/9]",
    none: "h-full w-full",
  };

  const containerAspectClass =
    isFullscreen || aspectRatio === "none"
      ? isFullscreen
        ? "flex min-h-screen w-full items-center justify-center"
        : aspectRatioClasses.none
      : aspectRatioClasses[aspectRatio];

  return (
    <div className={isMinimal && aspectRatio === "none" ? "h-full w-full" : "space-y-4"}>
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg bg-black group ${containerAspectClass} ${className}`}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          className={
            isFullscreen
              ? "max-h-screen max-w-[100vw] object-contain"
              : "h-full w-full object-contain"
          }
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {controls && (
          <div
            className={`absolute inset-0 flex flex-col justify-between opacity-0 transition-opacity duration-300  ${
              isMinimal
                ? "bg-linear-to-t from-black/80 via-transparent to-transparent"
                : "bg-linear-to-t from-black/80 via-transparent to-black/20"
            }`}
          >
            {!isMinimal && (
              <div className="flex flex-1 items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition-colors hover:bg-white/30"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8 fill-white text-white" />
                  ) : (
                    <Play className="h-8 w-8 fill-white text-white" />
                  )}
                </button>
              </div>
            )}

            <div className={`space-y-2 p-4 ${isMinimal ? "mt-auto" : ""}`}>
              {!isMinimal && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => {
                      if (!videoRef.current) return;
                      videoRef.current.currentTime = parseFloat(e.target.value);
                      setCurrentTime(parseFloat(e.target.value));
                    }}
                    className="h-1 w-full cursor-pointer rounded-full bg-white/30 accent-primary"
                  />
                  <div className="flex justify-between text-xs text-white/70">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="rounded-lg p-2 transition-colors hover:bg-white/10"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 fill-white text-white" />
                    ) : (
                      <Play className="h-4 w-4 fill-white text-white" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="rounded-lg p-2 transition-colors hover:bg-white/10"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-white" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-white" />
                    )}
                  </button>

                  {!isMinimal && (
                    <button
                      onClick={handleReset}
                      className="rounded-lg p-2 transition-colors hover:bg-white/10"
                      aria-label="Restart"
                    >
                      <RotateCcw className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>

                {showFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    className="rounded-lg p-2 transition-colors hover:bg-white/10"
                    aria-label={
                      isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4 text-white" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showDownload && src && (
        <VideoDownloadButton
          videoUrl={src}
          filename={downloadFilename}
          size="lg"
          className="w-full"
        />
      )}
    </div>
  );
}
