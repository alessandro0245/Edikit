"use client";

import { useState } from "react";
import { Film } from "lucide-react";

interface MovPreviewProps {
  src: string;
  className?: string;
}

function toMp4PreviewUrl(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;
  return url
    .replace(/\/upload\//, "/upload/f_mp4,vc_h264,q_auto/")
    .replace(/\.mov$/i, ".mp4");
}

function Fallback({ className }: { className: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 bg-black/20 ${className}`}>
      <Film className="w-8 h-8 text-white/50" />
      <p className="text-xs text-white/60 text-center px-4">
        MOV preview not available in browser.
        <br />Download to view.
      </p>
    </div>
  );
}

export default function MovPreview({ src, className = "" }: MovPreviewProps) {
  const [errored, setErrored] = useState(false);
  const previewUrl = toMp4PreviewUrl(src);

  if (!previewUrl || errored) {
    return <Fallback className={className} />;
  }

  return (
    <video
      src={previewUrl}
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
