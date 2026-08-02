"use client";

import { templates } from "@/utils/constant";
import TemplatesSlider from "./TemplatesSlider";
import { ArrowRight } from "lucide-react";
import EdikitHero from "./Hero";
import EdikitButton from "../ShimmerButton/ShimmerButton";
import EdikitPreloader from "../PreLoaderScreen/Edikitpreloader";

export default function Hero() {
  return (
    <div className="min-h-screen bg-[#191919]">
      <EdikitPreloader minDisplayMs={4500} />
      <main>
        <EdikitHero />

        {/* Templates Section */}
        <section
          className="relative overflow-hidden bg-[#191919] py-10 md:py-16"
          id="templates"
        >
          {/* ── Background decorations ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* ── Content ── */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="mb-10 space-y-4 text-center sm:mb-14 sm:space-y-5 md:mb-20">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  16 professionally crafted animations
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-balance">
                  Templates designed for{" "}
                  <span className="inline-block bg-linear-to-r from-[#1A73E8] to-[#5EB5FC] bg-clip-text text-transparent">
                    creators
                  </span>
                </h2>

                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                  Every template is professionally crafted by motion designers.
                  Customize text, colors and logos, then export instantly. No
                  animation experience needed.
                </p>
              </div>
            </div>

            {/* Template slider — wider than header for large cards */}
            <div className="relative z-10 mx-auto mb-4 w-full max-w-7xl px-2 sm:px-4">
              <TemplatesSlider templates={templates} />
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="flex justify-center pt-6 sm:pt-8">
                <EdikitButton
                  href="/templates"
                  variant="secondary"
                  size="lg"
                >
                  Browse All Templates
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </EdikitButton>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
