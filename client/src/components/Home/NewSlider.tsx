"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimationPreview from "@/components/Video/AnimationPreview";
import { templates, Template } from "@/utils/constant";
import { getTemplateOrientation } from "@/utils/templateOrientation";

interface NewSliderCardProps {
  template: Template;
}

function NewSliderCard({ template }: NewSliderCardProps) {
  const orientation = getTemplateOrientation(template);

  return (
    <Link href={`/customize/${template.id}`} className="group block w-full">
      <div className="flex origin-center flex-col overflow-hidden rounded-xl border-2 border-[#4B4B4B] bg-white transition-[border-color] duration-300 ease-in-out group-hover:border-primary sm:rounded-2xl aspect-[9/16] w-full">
        <AnimationPreview
          src={template.previewUrl}
          poster={template.thumbnail}
          orientation={orientation}
          fit="native"
          trigger="auto"  
          showControls={false}
          playOverlay={false}
          className="w-full h-full"
        />
        {/* <div className="bg-background p-3 transition-none sm:p-4">
          <p className="line-clamp-2 text-xs leading-relaxed text-white sm:text-sm md:text-base">
            {template.name}
          </p>
        </div> */}
      </div>
    </Link>
  );
}

const AUTOPLAY_DELAY = 5000;

export default function CarouselWithMultipleSlides() {
  const [api, setApi] = useState<CarouselApi>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  // Autoplay — mirrors old slider's 5s interval, pauses on hover
  useEffect(() => {
    if (!api) return;

    intervalRef.current = setInterval(scrollNext, AUTOPLAY_DELAY);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [api, scrollNext]);

  return (
    <div
      className="relative px-8 sm:px-10 md:px-12 lg:px-14">
      {/* Prev button — positioned to the side like old slider */}
      <button
        type="button"
        onClick={() => api?.scrollPrev()}
        aria-label="Previous templates"
        className="absolute left-0 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 sm:h-10 sm:w-10 md:h-11 md:w-11"
      >
        <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
      </button>

      {/* Next button — positioned to the side like old slider */}
      <button
        type="button"
        onClick={() => api?.scrollNext()}
        aria-label="Next templates"
        className="absolute right-0 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 sm:h-10 sm:w-10 md:h-11 md:w-11"
      >
        <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
      </button>

      <Carousel
        setApi={setApi}
        className="overflow-hidden"
        opts={{
          align: "center", // Centered on mobile (< 640px)
          loop: true,
          breakpoints: {
            "(min-width: 640px)": { align: "start" }, // Exact original layout on medium and desktop (>= 640px)
          },
        }}
      >
        <CarouselContent className="-ml-1.5 sm:-ml-2 md:-ml-3">
          {templates.map((template) => (
            template.id !== 19 && (
              <CarouselItem
                key={template.id}
                className="pl-1.5 sm:pl-2 md:pl-3 basis-[calc(100vw-6rem)] sm:basis-[320px] md:basis-1/2 lg:basis-1/3"
              >
                <NewSliderCard template={template} />
              </CarouselItem>
            )
          ))}
        </CarouselContent>
        {/* No CarouselPrevious/CarouselNext — using custom buttons above */}
      </Carousel>
    </div>
  );
}
