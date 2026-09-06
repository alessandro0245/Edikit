"use client";

import React from "react";
import Image from "next/image";
import EdikitButton from "../ShimmerButton/ShimmerButton";
import { ArrowRight } from "lucide-react";

interface MatchCutProps {
  scene1Video?: string;
  scene2Video?: string;
  scene1Poster?: string;
  scene2Poster?: string;
  scene1Content?: React.ReactNode;
  scene2Content?: React.ReactNode;
}

const MatchCut: React.FC<MatchCutProps> = ({
  scene1Video,
  scene2Video,
  scene1Poster,
  scene2Poster,
  scene1Content,
  scene2Content,
}) => {
  return (
    <section className="relative w-full bg-[#191919] text-foreground px-4 sm:px-6 py-16 md:py-24 overflow-hidden antialiased">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
          {/* Badge: New template */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Match cut Template
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight text-balance">
            One topic.{" "}
            <span className="inline-block bg-gradient-to-r from-[#1A73E8] via-[#3B82F6] to-[#5EB5FC] bg-clip-text text-transparent">
              Instant match cut.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto text-pretty leading-relaxed">
            Type any name or idea and Edikit renders the viral search-results intro — headlines, posts and videos morphing around your topic. No timeline, no keyframes.
          </p>
        </div>

        {/* Visual / Cards Section */}
        <div className="relative mx-auto mt-12 md:mt-16 flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-6 max-w-5xl">
          {/* Card 1: Scene 01 */}
          <div className="relative w-full md:w-1/2 rounded-[22px] border border-white/10 bg-[#121316] p-5 sm:p-6 flex flex-col justify-between">
            {/* Scene Header */}
            <div className="text-[11px] font-mono font-medium tracking-[0.18em] text-zinc-500 uppercase mb-4">
              SCENE 01 — TYPE
            </div>

            {/* Scene Body / Video or Image slot */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#090a0d] border border-white/5 flex items-center justify-center group">
              {scene1Content ? (
                scene1Content
              ) : scene1Video ? (
                <video
                  src={scene1Video}
                  poster={scene1Poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/matchcut/scene01.jpg"
                  alt="Scene 01 — Type"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
            </div>

            {/* Scene Footer */}
            <div className="mt-4 text-xs text-zinc-500">
              Your topic, typed once — that&apos;s the whole edit
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-zinc-500 shrink-0 py-1 md:py-0">
            <ArrowRight className="w-5 h-5 hidden md:block" />
            <span className="md:hidden text-lg">↓</span>
          </div>

          {/* Card 2: Scene 02 */}
          <div className="relative w-full md:w-1/2 rounded-[22px] border border-white/10 bg-[#121316] p-5 sm:p-6 flex flex-col justify-between">
            {/* Scene Header */}
            <div className="text-[11px] font-mono font-medium tracking-[0.18em] text-zinc-500 uppercase mb-4">
              SCENE 02 — THE CUT
            </div>

            {/* Scene Body / Video or Image slot */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#090a0d] border border-white/5 flex items-center justify-center group">
              {scene2Content ? (
                scene2Content
              ) : scene2Video ? (
                <video
                  src={scene2Video}
                  poster={scene2Poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/matchcut/scene02.jpg"
                  alt="Scene 02 — The Cut"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
            </div>

            {/* Scene Footer / placeholder spacer for symmetry */}
            <div className="mt-4 text-xs text-transparent select-none" aria-hidden="true">
              &nbsp;
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 sm:mt-14 flex items-center justify-center gap-4 flex-wrap">
          <EdikitButton
            href="/match-cut"
            variant="primary"
            size="md"
            className="uppercase tracking-wider font-bold px-7 py-3 text-xs sm:text-sm"
          >
            Try Match Cut
          </EdikitButton>

        </div>
      </div>
    </section>
  );
};

export default MatchCut;
