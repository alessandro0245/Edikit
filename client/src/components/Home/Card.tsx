"use client";

import { ArrowRight } from "lucide-react";
import { StaticImageData } from "next/image";
import Link from "next/link";
import AnimationPreview from "@/components/Video/AnimationPreview";
import {
  getOrientationFromDimensions,
} from "@/utils/templateOrientation";

interface TemplateCardProps {
  id: number;
  name: string;
  thumbnail?: string | StaticImageData;
  isFeatured?: boolean;
  previewUrl: string;
  backgroundDimensions?: string;
}

export default function Card({
  id,
  name,
  thumbnail,
  isFeatured = false,
  previewUrl,
  backgroundDimensions,
}: TemplateCardProps) {
  const orientation = getOrientationFromDimensions(backgroundDimensions);

  return (
    <Link href={`/customize/${id}`}>
      <div
        className={`group h-full rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
          isFeatured
            ? "bg-linear-to-br from-card to-card/80 border-primary hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] hover:-translate-y-1"
            : "border-border bg-card hover:border-primary/60 shadow-lg hover:shadow-primary/10 hover:shadow-xl hover:-translate-y-1"
        }`}
      >
        <div className="relative w-full overflow-hidden bg-black">
          <AnimationPreview
            src={previewUrl}
            poster={thumbnail}
            orientation={orientation}
            fit="native"
            trigger="hover"
            showControls={false}
            playOverlay
          />
        </div>

        <div className={`space-y-3 ${isFeatured ? "p-8" : "p-5"}`}>
          <h3
            className={`font-bold transition-colors duration-200 group-hover:text-primary ${
              isFeatured ? "text-2xl" : "text-lg"
            }`}
          >
            {name}
          </h3>

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
