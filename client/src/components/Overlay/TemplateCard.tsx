'use client'

import { useState, useRef, useEffect, type MouseEvent } from 'react'
import { Template } from '@/utils/constant'
import Link from 'next/link';

interface TemplateCardProps {
  template: Template
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [videoRequested, setVideoRequested] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewUrl = (template as Template & { previewUrl?: string }).previewUrl

  // Request video load on first hover
  const handleMouseEnter = () => {
    setIsHovered(true)

    if (!videoRequested && videoRef.current) {
      setVideoRequested(true)
      setIsVideoLoading(true)
      // ensure the video element has a source set for load()
      try {
        if (previewUrl) videoRef.current.src = previewUrl
        videoRef.current.load()
      } catch {}
    }
  }

  // Toggle play/pause when user clicks the video area.
  // If the video wasn't requested yet, start loading it and set hover state.
  const handleVideoClick = (e: MouseEvent<HTMLVideoElement>) => {
    e.stopPropagation()
    if (!videoRef.current) return

    if (!videoRequested) {
      setVideoRequested(true)
      setIsVideoLoading(true)
      setIsHovered(true)
      // set src then load so browsers fetch the video
      try {
        if (previewUrl) videoRef.current.src = previewUrl
        videoRef.current.load()
      } catch {}
      return
    }

    if (isVideoLoaded) {
      try {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {})
          setIsHovered(true)
        } else {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
          setIsHovered(false)
        }
      } catch {}
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  // Handle video ready to play
  const handleVideoCanPlay = () => {
    setIsVideoLoading(false)
    setIsVideoLoaded(true)

    // Auto-play when loaded
    if (videoRef.current && isHovered) {
      videoRef.current.play().catch(() => {
        // Silently handle autoplay errors due to browser policies
      })
    }
  }

  // Play video when hover state changes to true and video is ready
  useEffect(() => {
    if (isHovered && isVideoLoaded && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Silently handle autoplay errors
      })
    }
  }, [isHovered, isVideoLoaded])

  return (
    <div
      className="group relative aspect-2/3 w-full rounded-lg overflow-hidden bg-gray-100 transition-all duration-1000 hover:shadow-lg hover:-translate-y-3 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Static Thumbnail */}
      {(!isVideoLoaded || !isHovered) && (
        <img
          src={imageError ? '/images/placeholder.svg' : template.thumbnail}
          alt={template.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered && isVideoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          onError={() => setImageError(true)}
        />
      )}

      {/* Video Preview */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300  cursor-pointer ${
          isHovered && isVideoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        muted
        loop
        playsInline
        onCanPlay={handleVideoCanPlay}
        onError={() => {
          setVideoError(true)
          setIsVideoLoading(false)
        }}
        onClick={handleVideoClick}
      >
        {previewUrl ? <source src={previewUrl} type="video/mp4" /> : null}
      </video>

      {/* Loading Spinner */}
      {isVideoLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Play Button - visible on static image */}
      {(!isVideoLoaded || !isHovered) && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors duration-300">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white transition-colors duration-300">
            <svg
              className="w-6 h-6 text-gray-900 ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-primary uppercase tracking-wider">
            {template.category}
          </div>
          <h3 className="text-foreground font-semibold text-sm group-hover:text-primary transition-colors duration-300">
            {template.name}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>

      {/* Customize Button */}
      <Link href={`/customize/${template.id}`}>
        <button
          className="absolute top-4 right-4 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
        >
          Customize
        </button>
      </Link>
    </div>
  )
}
