"use client";

import { useState } from "react";
import { Film } from "lucide-react";

interface MovPreviewProps {
  src: string;
  previewUrl?: string | null;
  className?: string;
}

export function toMp4PreviewUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes(".mp4")) return url;
  // Cloudinary fallback
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

export default function MovPreview({
  src,
  previewUrl: explicitPreviewUrl,
  className = "",
}: MovPreviewProps) {
  const [errored, setErrored] = useState(false);
  const resolvedPreviewUrl =
    explicitPreviewUrl && !explicitPreviewUrl.toLowerCase().includes(".mov")
      ? explicitPreviewUrl
      : toMp4PreviewUrl(explicitPreviewUrl || src);

  if (!resolvedPreviewUrl || errored) {
    return <Fallback className={className} />;
  }

  return (
    <video
      src={resolvedPreviewUrl}
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
