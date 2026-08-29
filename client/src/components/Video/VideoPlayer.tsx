"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import Image from "next/image";
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

  const [hasStarted, setHasStarted] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasStarted(false);
    setIsLoaded(false);
    setIsPlaying(false);
    setPosterError(false);
  }, [src]);

  const isMinimal = variant === "minimal";

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
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
        className={`relative overflow-hidden rounded-lg bg-black group cursor-pointer ${containerAspectClass} ${className}`}
        onClick={togglePlay}
      >
        {poster && !posterError && (
          <Image
            src={poster}
            alt="video thumbnail"
            fill
            className={`object-cover transition-opacity duration-300 ${hasStarted ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setPosterError(true)}
          />
        )}

        {isLoading && !hasStarted && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 pointer-events-none">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

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
              : `absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hasStarted ? "opacity-100" : "opacity-0"}`
          }
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onCanPlay={() => {
            setIsLoading(false);
            setIsLoaded(true);
          }}
          onPlay={() => {
            setIsPlaying(true);
            setHasStarted(true);
          }}
          onPause={() => setIsPlaying(false)}
          onError={() => setIsLoading(false)}
        />

        {controls && isLoaded && (
          <div
            className={`absolute bottom-2 left-0 right-0 flex items-center justify-between px-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-20`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#191919] backdrop-blur-sm transition-all active:scale-95 group/control cursor-pointer"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-3 w-3 text-white" />
                ) : (
                  <Volume2 className="h-3 w-3 text-white" />
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
                className="flex h-6 w-6 items-center justify-center rounded-full 
                bg-[#191919] backdrop-blur-sm transition-all active:scale-95 group/control mr-1 cursor-pointer"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 text-white" />
                ) : (
                  <Maximize2 className="h-3 w-3 text-white" />
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
