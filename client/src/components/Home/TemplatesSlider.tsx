"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Template } from "@/utils/constant";
import {
  getTemplateOrientation,
  orientationContainerClass,
} from "@/utils/templateOrientation";

interface TemplatesSliderProps {
  templates: Template[];
}

function getCardsPerView() {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}

function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(1);

  useEffect(() => {
    const update = () => setCardsPerView(getCardsPerView());

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cardsPerView;
}

function getEdgeMask(cardsPerView: number) {
  if (cardsPerView === 1) {
    return "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 3%, black 6%, black 94%, rgba(0,0,0,0.4) 97%, transparent 100%)";
  }
  if (cardsPerView === 2) {
    return "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 4%, rgba(0,0,0,0.75) 8%, black 13%, black 87%, rgba(0,0,0,0.75) 92%, rgba(0,0,0,0.3) 96%, transparent 100%)";
  }
  return "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.25) 4%, rgba(0,0,0,0.65) 8%, black 14%, black 86%, rgba(0,0,0,0.65) 92%, rgba(0,0,0,0.25) 96%, transparent 100%)";
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}


function getTranslateIndex(centerIndex: number, cardsPerView: number) {
  if (cardsPerView === 3) return centerIndex - 1;
  return centerIndex;
}

interface SliderCardProps {
  template: Template;
  isCenter: boolean;
  cardsPerView: number;
}

function SliderCard({ template, isCenter, cardsPerView }: SliderCardProps) {
  const orientation = getTemplateOrientation(template);

  return (
    <div className="flex justify-center px-1.5 sm:px-2 md:px-3">
      <Link
        href={`/customize/${template.id}`}
        className={`group block w-full transition-transform duration-300 ease-in-out ${
          cardsPerView === 1
            ? "max-w-[min(75vw,280px)] sm:max-w-[320px] md:max-w-[360px]"
            : ""
        }`}
        style={{ transform: isCenter ? "scale(1)" : "scale(0.97)" }}
      >
        <div className="flex origin-center flex-col overflow-hidden rounded-xl border-2 bg-white shadow-lg shadow-black/20 transition-[border-color] duration-300 ease-in-out group-hover:border-primary sm:rounded-2xl">
          {/* Media area */}
          <div
            className={`relative overflow-hidden bg-black ${orientationContainerClass[orientation]}`}
            onMouseEnter={(e) => {
              const v = e.currentTarget.querySelector("video");
              if (v) void v.play();
            }}
            onMouseLeave={(e) => {
              const v = e.currentTarget.querySelector("video");
              if (v) { v.pause(); v.currentTime = 0; }
            }}
          >
            {/* Static thumbnail — always visible as base layer */}
            {template.thumbnail && (
              <img
                src={template.thumbnail}
                alt={template.name}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            )}
            {/* Video — fades in on hover */}
            <video
              src={template.previewUrl}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </div>

          {/* Label — hardcoded dark bg to avoid global bg-color transition flickering */}
          <div className="bg-[#111827] p-3 transition-none sm:p-4">
            <p className="line-clamp-2 text-xs leading-relaxed text-white sm:text-sm md:text-base">
              {template.name}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function TemplatesSlider({ templates }: TemplatesSliderProps) {
  const total = templates.length;
  const cardsPerView = useCardsPerView();
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const extendedTemplates = [...templates, ...templates, ...templates];
  const [centerIndex, setCenterIndex] = useState(total);
  const [slideWidth, setSlideWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const activeDot = wrapIndex(centerIndex, total);
  const translateIndex = getTranslateIndex(centerIndex, cardsPerView);
  const translateX = slideWidth > 0 ? -translateIndex * slideWidth : 0;

  const measureSlideWidth = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setSlideWidth(viewport.offsetWidth / cardsPerView);
  }, [cardsPerView]);

  useEffect(() => {
    measureSlideWidth();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(measureSlideWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measureSlideWidth]);

  const goTo = useCallback(
    (direction: "prev" | "next") => {
      setIsAnimating(true);
      setCenterIndex((prev) =>
        direction === "prev" ? prev - 1 : prev + 1,
      );
    },
    [],
  );

  const goToDot = useCallback(
    (dotIndex: number) => {
      setIsAnimating(true);
      setCenterIndex((prev) => {
        const current = wrapIndex(prev, total);
        let diff = dotIndex - current;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;
        return prev + diff;
      });
    },
    [total],
  );

  const handleTransitionEnd = useCallback(() => {
    if (centerIndex >= total * 2) {
      setIsAnimating(false);
      setCenterIndex((prev) => prev - total);
      return;
    }

    if (centerIndex < total) {
      setIsAnimating(false);
      setCenterIndex((prev) => prev + total);
    }
  }, [centerIndex, total]);

  useEffect(() => {
    if (!isAnimating) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isAnimating]);

  useEffect(() => {
    if (isHovered || total === 0) return;

    const intervalId = window.setInterval(() => {
      goTo("next");
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [goTo, isHovered, total]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const delta = touchStartX.current - endX;

    if (Math.abs(delta) < 50) return;
    goTo(delta > 0 ? "next" : "prev");
  };

  if (total === 0) return null;

  const edgeMask = getEdgeMask(cardsPerView);

  return (
    <div
      className="relative px-8 sm:px-10 md:px-12 lg:px-14"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => goTo("prev")}
        aria-label="Previous templates"
        className="absolute left-0 top-[42%] z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 sm:top-1/2 sm:h-10 sm:w-10 md:h-11 md:w-11"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <button
        type="button"
        onClick={() => goTo("next")}
        aria-label="Next templates"
        className="absolute right-0 top-[42%] z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 sm:top-1/2 sm:h-10 sm:w-10 md:h-11 md:w-11"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <div
        ref={viewportRef}
        className="overflow-hidden"
        style={{
          WebkitMaskImage: edgeMask,
          maskImage: edgeMask,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isAnimating
              ? "transform 300ms ease-in-out"
              : "none",
          }}
        >
          {extendedTemplates.map((template, index) => (
            <div
              key={`${template.id}-${index}`}
              className="shrink-0"
              style={{ width: slideWidth > 0 ? slideWidth : `${100 / cardsPerView}%` }}
            >
              <SliderCard
                template={template}
                isCenter={index === centerIndex}
                cardsPerView={cardsPerView}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex max-w-full items-center justify-center gap-1 overflow-x-auto px-2 pb-1 sm:mt-8 sm:gap-2 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {templates.map((template, index) => (
          <button
            key={template.id}
            type="button"
            aria-label={`Go to template ${template.name}`}
            aria-current={index === activeDot ? "true" : undefined}
            onClick={() => goToDot(index)}
            className={`shrink-0 rounded-full transition-all duration-300 ${
              index === activeDot
                ? "h-1.5 w-5 bg-primary sm:h-2 sm:w-6"
                : "h-1.5 w-1.5 bg-white/30 hover:bg-white/50 sm:h-2 sm:w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
