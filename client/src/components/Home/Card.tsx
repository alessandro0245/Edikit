"use client";

import { Play, Loader2, ArrowRight } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

interface TemplateCardProps {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string | StaticImageData;
  category: string;
  isFeatured?: boolean;
  previewUrl: string;
}

export default function Card({
  id,
  name,
  description,
  thumbnail,
  isFeatured = false,
  previewUrl,
}: TemplateCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (!isVideoLoaded) setIsVideoLoading(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsVideoLoading(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleLoaded = () => {
    setIsVideoLoaded(true);
    setIsVideoLoading(false);
  };

  return (
    <Link
      href={`/customize/${id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`group h-full rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
          isFeatured
            ? "bg-linear-to-br from-card to-card/80 border-primary hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] hover:-translate-y-1"
            : "border-border bg-card hover:border-primary/60 shadow-lg hover:shadow-primary/10 hover:shadow-xl hover:-translate-y-1"
        }`}
      >
        {/* Media */}
        <div className="relative aspect-4/5 w-full overflow-hidden bg-muted">

          {/* Thumbnail */}
          {thumbnail && (
            <Image
              src={thumbnail}
              alt={name}
              fill
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                isHovering && isVideoLoaded ? "opacity-0" : "opacity-100"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Video */}
          <video
            ref={videoRef}
            src={previewUrl}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isHovering && isVideoLoaded ? "opacity-100" : "opacity-0"
            }`}
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedData={handleLoaded}
          />

          {/* Loader */}
          {isHovering && isVideoLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {/* Play Overlay */}
          {!isHovering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm transition-transform group-hover:scale-110">
                <Play className="h-5 w-5 fill-primary-foreground text-primary-foreground ml-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`space-y-3 ${isFeatured ? "p-8" : "p-5"}`}>
          <h3
            className={`font-bold transition-colors duration-200 group-hover:text-primary ${
              isFeatured ? "text-2xl" : "text-lg"
            }`}
          >
            {name}
          </h3>

          {description && (
            <p className={`text-muted-foreground leading-snug ${isFeatured ? "text-base" : "text-sm"}`}>
              {description}
            </p>
          )}

          {/* Explore button — always visible, animates on hover */}
          <div className="pt-3 border-t border-border/50">
            <span
              className={`inline-flex items-center gap-1.5 font-semibold text-primary transition-all duration-200 ${
                isFeatured ? "text-base" : "text-sm"
              }`}
            >
              Explore
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
