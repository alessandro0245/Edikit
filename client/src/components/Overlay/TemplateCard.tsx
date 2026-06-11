"use client";

import Link from "next/link";
import { Template } from "@/utils/constant";
import AnimationPreview from "@/components/Video/AnimationPreview";
import { getTemplateOrientation } from "@/utils/templateOrientation";

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const orientation = getTemplateOrientation(template);

  return (
    <Link href={`/customize/${template.id}`} className="group block w-full">
      <div className="overflow-hidden rounded-2xl border border-border bg-black transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-black/10">
        <AnimationPreview
          src={template.previewUrl}
          poster={template.thumbnail}
          orientation={orientation}
          fit="native"
          trigger="auto"
          showControls={false}
          playOverlay={false}
          className="w-full"
        />
        <div className="border-t border-border bg-card px-3.5 py-2.5">
          <h3 className="truncate text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
            {template.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}
