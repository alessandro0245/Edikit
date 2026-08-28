"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Loader2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import {
  orientationContainerClass,
  type VideoOrientation,
} from "@/utils/templateOrientation";

interface AnimationPreviewProps {
  src: string;
  poster?: string | StaticImageData;
  orientation?: VideoOrientation;
  fit?: "native" | "contain";
  objectPosition?: "center" | "top" | "bottom";
  trigger?: "hover" | "click" | "auto";
  className?: string;
  showFullscreen?: boolean;
  showControls?: boolean;
  prefetchOnVisible?: boolean;
  playOverlay?: boolean;
  onClickHint?: string;
}

const objectPositionClasses: Record<"center" | "top" | "bottom", string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
};

export default function AnimationPreview({
  src,
  poster,
  orientation = "portrait",
  fit = "native",
  objectPosition = "center",
  trigger = "hover",
  className = "",
  showFullscreen = false,
  showControls = true,
  prefetchOnVisible = true,
  playOverlay: _playOverlay = true,
  onClickHint,
}: AnimationPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoRequested, setVideoRequested] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const posterSrc =
    typeof poster === "string" ? poster : poster?.src ?? undefined;

  // Reset playback and error state whenever the video src changes
  useEffect(() => {
    setHasStarted(false);
    setIsLoaded(false);
    setIsPlaying(false);
    setVideoRequested(false);
    setIsLoading(false);
    setPosterError(false);
    setVideoError(false);
  }, [src]);

  const requestVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || videoRequested) return;

    setVideoRequested(true);
    setIsLoading(true);
    video.src = src;
    video.load();
  }, [src, videoRequested]);

  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;
    video.play().catch(() => { });
  }, [isLoaded]);

  const pauseVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
  }, []);

  const handleMouseEnter = () => {
    if (trigger !== "hover") return;
    setIsActive(true);
    requestVideo();
  };

  const handleMouseLeave = () => {
    if (trigger !== "hover") return;
    setIsActive(false);
    pauseVideo();
  };
  // Keep a stable ref to requestVideo so the IntersectionObserver effect
  // doesn't re-run (and tear-down/re-create the observer) when videoRequested toggles.
  const requestVideoRef = useRef(requestVideo);
  useEffect(() => {
    requestVideoRef.current = requestVideo;
  }, [requestVideo]);

  // Autoplay/preload viewport control for trigger === "auto"
  useEffect(() => {
    if (trigger !== "auto" || !containerRef.current) return;

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsActive(true);
          requestVideoRef.current();
        } else {
          setIsActive(false);
          setVideoRequested(false);
          setIsLoaded(false);
          setIsPlaying(false);
          setIsLoading(false);
          setHasStarted(false);
          const video = videoRef.current;
          if (video) {
            video.removeAttribute("src");
            video.load();
          }
        }
      },
      { rootMargin: "150px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger, src]);


  const togglePlay = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      if (!videoRequested) {
        setIsActive(true);
        requestVideo();
        return;
      }
      playVideo();
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setIsLoaded(true);

    const shouldPlay =
      trigger === "auto" ||
      (trigger === "hover" ? isActive : trigger === "click" && isActive);

    if (shouldPlay && videoRef.current) {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.().catch(() => { });
    } else {
      await document.exitFullscreen?.().catch(() => { });
    }
  };

  useEffect(() => {
    if (trigger === "hover" || trigger === "auto") {
      if (isActive && isLoaded) {
        playVideo();
      } else if (!isActive) {
        pauseVideo();
      }
    }
  }, [trigger, isActive, isLoaded, playVideo, pauseVideo]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!prefetchOnVisible || videoRequested || !containerRef.current || trigger === "auto") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          requestVideo();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [prefetchOnVisible, requestVideo, videoRequested, trigger]);

  const containerAspectClass =
    fit === "native" ? orientationContainerClass[orientation] : "h-full w-full";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black group/preview cursor-pointer ${isFullscreen
        ? "flex min-h-screen w-full items-center justify-center"
        : containerAspectClass
        } ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={togglePlay}
    >
      {poster && !posterError && (
        <Image
          src={poster}
          alt="template preview"
          fill
          className={`object-cover ${objectPositionClasses[objectPosition]} transition-opacity duration-300 ${hasStarted ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={() => setPosterError(true)}
        />
      )}


      {!posterSrc && !isLoaded && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="text-xs text-white/60">No preview</p>
        </div>
      )}

      <video
        ref={videoRef}
        poster={posterSrc}
        className={
          isFullscreen
            ? "max-h-screen max-w-[100vw] object-cover"
            : `absolute inset-0 h-full w-full object-cover ${objectPositionClasses[objectPosition]} transition-opacity duration-300 ${hasStarted ? "opacity-100" : "opacity-0"
            }`
        }
        loop
        muted={isMuted}
        playsInline
        preload="none"
        onCanPlay={handleCanPlay}
        onPlay={() => {
          setIsPlaying(true);
          setHasStarted(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setVideoError(true);
          setIsLoading(false);
        }}
      />


      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {onClickHint && trigger === "click" && !isPlaying && !isLoading && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-xs font-medium text-white">{onClickHint}</p>
        </div>
      )}

      {showControls && isLoaded && (
        <div
          className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-2 opacity-100 md:opacity-0 md:group-hover/preview:opacity-100 transition-opacity duration-300 z-20"
          onClick={(e) => e.stopPropagation()}
          data-preview-control
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-preview-control
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all active:scale-95 group/control cursor-pointer"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-white" />
              ) : (
                <Volume2 className="h-4 w-4 text-white" />
              )}
            </button>
          </div>

          {showFullscreen && (
            <button
              type="button"
              data-preview-control
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all active:scale-95 group/control cursor-pointer"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-white" />
              ) : (
                <Maximize2 className="h-4 w-4 text-white" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
