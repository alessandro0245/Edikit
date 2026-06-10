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
    <Link
      href={`/customize/${template.id}`}
      className="group block w-full"
    >
      <div className="overflow-hidden rounded-3xl border-2 border-transparent bg-black transition-colors duration-300 group-hover:border-primary">
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
      </div>

      <h3 className="mt-3 text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
        {template.name}
      </h3>
    </Link>
  );
}
