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
            className={`absolute bottom-4 left-0 right-0 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 group/control"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-white text-white transition-transform group-hover/control:scale-110" />
                ) : (
                  <Play className="h-5 w-5 fill-white text-white transition-transform group-hover/control:scale-110" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 group/control"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white transition-transform group-hover/control:scale-110" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white transition-transform group-hover/control:scale-110" />
                )}
              </button>
            </div>

            {!isMinimal && (
              <div className="flex-1 max-w-sm px-4">
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
                  className="w-full h-1 cursor-pointer appearance-none bg-white/20 rounded-full accent-white"
                />
              </div>
            )}

            {showFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 group/control"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5 text-white transition-transform group-hover/control:scale-110" />
                ) : (
                  <Maximize2 className="h-5 w-5 text-white transition-transform group-hover/control:scale-110" />
                )}
              </button>
            )}
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
