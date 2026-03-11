"use client";

import { Play, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

const Video = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(true);
  };

  const handleLoaded = () => {
    setIsLoading(false);
    videoRef.current?.play().catch(() => {});
  };

  const handleEnded = () => {
    // Reset back to image state
    setIsPlaying(false);
    setIsLoading(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="h-full">
      <div className="relative h-full min-h-100 rounded-2xl bg-black border-2 border-primary/30 overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
        {/* Video */}
        {isPlaying && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            src="/previews/animation-6.mp4"
            playsInline
            onLoadedData={handleLoaded}
            onEnded={handleEnded}
          />
        )}

        {/* Poster Image */}
        {!isPlaying && (
          <Image
            src="/previews/cyan-hero-img.png"
            alt="Hero Image"
            fill
            className="object-contain"
            priority
          />
        )}

        {/* Loader */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Play Overlay */}
        {!isPlaying && !isLoading && (
          <div
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer "
          >
            <div className="relative flex items-center justify-center">
              {/* Pulse ring */}
              <span className="absolute w-24 h-24 rounded-full bg-primary/30 animate-ping" />
              {/* Button */}
              <div
                className="relative w-20 h-20 rounded-full bg-primary/90 shadow-lg shadow-primary/50 flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl
              border border-gray-700 group-hover:shadow-primary/60 transition-all duration-200"
              >
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Video;
