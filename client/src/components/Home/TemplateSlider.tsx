"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Template } from "@/utils/constant";
import AnimationPreview from "@/components/Video/AnimationPreview";
import { getTemplateOrientation } from "@/utils/templateOrientation";

interface TemplateSliderProps {
  templates: Template[];
}

type SlideRole = "left" | "center" | "right";

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function getSlideVisuals(role: SlideRole) {
  switch (role) {
    case "center":
      return { scale: 1, opacity: 1 };
    case "left":
    case "right":
      return { scale: 0.88, opacity: 0.5 };
  }
}

interface SlideProps {
  template: Template;
  role: SlideRole;
}

function Slide({ template, role }: SlideProps) {
  const orientation = getTemplateOrientation(template);
  const { scale, opacity } = getSlideVisuals(role);
  const isCenter = role === "center";

  return (
    <div
      className="flex justify-center transition-all duration-500 ease-out"
      style={{ transform: `scale(${scale})`, opacity }}
    >
      <Link
        href={`/customize/${template.id}`}
        className={`group block w-full ${
          isCenter
            ? "max-w-[260px] sm:max-w-[300px] md:max-w-[340px] lg:max-w-[360px]"
            : "max-w-[220px] sm:max-w-[250px] md:max-w-[280px] lg:max-w-[300px]"
        }`}
      >
        <div
          className={`overflow-hidden rounded-3xl transition-all duration-300 ${
            isCenter
              ? "border border-primary/30 shadow-[0_28px_70px_-18px_rgba(26,115,232,0.45)]"
              : "border border-white/6 "
          } group-hover:border-primary/50 `}
        >
          <AnimationPreview
            src={template.previewUrl}
            poster={template.thumbnail}
            orientation={orientation}
            fit="native"
            trigger="hover"
            showControls={false}
            playOverlay={false}
            className="w-full"
          />
        </div>

        <p
          className={`mt-4 text-center leading-snug transition-colors duration-300 ${
            isCenter
              ? "text-base font-semibold text-foreground md:text-lg"
              : "text-sm font-medium text-muted-foreground/80"
          }`}
        >
          {template.name}
        </p>
      </Link>
    </div>
  );
}

export default function TemplateSlider({ templates }: TemplateSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = templates.length;

  const goTo = useCallback(
    (direction: "prev" | "next") => {
      setActiveIndex((prev) =>
        direction === "prev"
          ? wrapIndex(prev - 1, total)
          : wrapIndex(prev + 1, total),
      );
    },
    [total],
  );

  const prevTemplate = templates[wrapIndex(activeIndex - 1, total)];
  const centerTemplate = templates[activeIndex];
  const nextTemplate = templates[wrapIndex(activeIndex + 1, total)];

  return (
    <div className="space-y-10">
      <div className="grid min-w-0 grid-cols-[1fr_1.3fr_1fr] items-center gap-2 sm:gap-5 md:gap-8">
        <div className="flex min-w-0 justify-end">
          <Slide template={prevTemplate} role="left" />
        </div>

        <div className="flex min-w-0 justify-center">
          <Slide template={centerTemplate} role="center" />
        </div>

        <div className="flex min-w-0 justify-start">
          <Slide template={nextTemplate} role="right" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => goTo("prev")}
          aria-label="Previous template"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all duration-200 hover:border-primary/50 hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <p className="min-w-[72px] text-center text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="mx-1.5 text-border">/</span>
          {String(total).padStart(2, "0")}
        </p>

        <button
          type="button"
          onClick={() => goTo("next")}
          aria-label="Next template"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all duration-200 hover:border-primary/50 hover:text-primary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
