"use client";

import { useState } from "react";
import { Film } from "lucide-react";

interface MovPreviewProps {
  src: string;
  previewUrl?: string;
  className?: string;
}

export function toMp4PreviewUrl(url: string): string | null {
  // S3 presigned URLs or non-Cloudinary .mov files: no on-the-fly transcoding available
  if (!url.includes("res.cloudinary.com")) return null;
  return url
    .replace(/\/upload\//, "/upload/f_mp4,vc_h264,q_auto/")
    .replace(/\.mov$/i, ".mp4");
}

function Fallback({ className }: { className: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 bg-black/20 ${className}`}
    >
      <Film className="w-8 h-8 text-white/50" />
      <p className="text-xs text-white/60 text-center px-4">
        MOV preview not available in browser.
        <br />
        Download to view.
      </p>
    </div>
  );
}

export default function MovPreview({ src, previewUrl, className = "" }: MovPreviewProps) {
  const [errored, setErrored] = useState(false);
  const isMp4Src = (() => {
    try {
      return new URL(src, "http://localhost").pathname.toLowerCase().endsWith(".mp4");
    } catch {
      return src.split("?")[0].toLowerCase().endsWith(".mp4");
    }
  })();
  const effectivePreviewUrl = previewUrl || (isMp4Src ? src : toMp4PreviewUrl(src));

  if (!effectivePreviewUrl || errored) {
    return <Fallback className={className} />;
  }

  return (
    <video
      src={effectivePreviewUrl}
      className={className}
      controls
      autoPlay
      muted
      loop
      playsInline
      onError={() => setErrored(true)}
    />
  );
}
