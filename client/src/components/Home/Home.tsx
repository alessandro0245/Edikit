"use client";

import Link from "next/link";
import { templates } from "@/utils/constant";
import TemplatesSlider from "./TemplatesSlider";
import { ArrowRight } from "lucide-react";
import EdikitHero from "./Hero";
import EdikitButton from "../ShimmerButton/ShimmerButton";

export default function Hero() {
  return (
    <div className="min-h-screen bg-[#191919]">
      <main>
        {/* <Prompt /> */}
        <EdikitHero />

        {/* Templates Section */}
        <section
          className="relative overflow-hidden bg-[#191919] py-16 md:py-24"
          id="templates"
        >
          {/* ── Background decorations ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {/* Dot grid */}
            {/* <svg className="absolute inset-0 w-full h-full opacity-5">
              <defs>
                <pattern
                  id="dot-grid"
                  width="28"
                  height="28"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dot-grid)" />
            </svg> */}

            {/* Glow top-right */}
            {/* <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/8 blur-[100px] animate-hero-glow" /> */}
            {/* Glow bottom-left */}
            {/* <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/6 blur-[80px] animate-hero-glow-delayed" /> */}

            {/* Floating circle outline — top left */}
            {/* <svg
              className="absolute top-12 left-[6%] w-14 h-14 text-primary/20 animate-float-slow"
              viewBox="0 0 56 56"
              fill="none"
            >
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
            </svg> */}

            {/* Floating cross — top right */}
            {/* <svg
              className="absolute top-20 right-[8%] w-8 h-8 text-primary/25 animate-float-delayed"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M16 4v24M4 16h24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg> */}

            {/* Floating diamond — bottom right */}
            {/* <svg
              className="absolute bottom-16 right-[12%] w-10 h-10 text-primary/15 animate-float"
              viewBox="0 0 40 40"
              fill="none"
            >
              <rect
                x="8"
                y="8"
                width="24"
                height="24"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
                transform="rotate(45 20 20)"
              />
            </svg> */}

            {/* Floating dots cluster — bottom left */}
            {/* <svg
              className="absolute bottom-24 left-[10%] w-16 h-16 text-primary/15 animate-float-slow"
              viewBox="0 0 64 64"
              fill="currentColor"
            >
              <circle cx="16" cy="16" r="3" />
              <circle cx="32" cy="10" r="2" />
              <circle cx="48" cy="20" r="3" />
              <circle cx="20" cy="44" r="2" />
              <circle cx="44" cy="48" r="3" />
            </svg> */}
          </div>

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
                {/* <Link
                  href="/templates"
                  className="group inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary hover:shadow-md hover:shadow-primary/10 sm:px-8 sm:py-3.5"
                >
                  Browse All Templates
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link> */}
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
