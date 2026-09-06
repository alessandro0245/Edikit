"use client";

import React from "react";
import { Search } from "lucide-react";
import ShimmerButton from "@/components/ShimmerButton/ShimmerButton";
import {
  useMatchCutLogic,
  AspectRatio,
  Resolution,
} from "./useMatchCutLogic";
import MatchCutReadyCard from "./MatchCutReadyCard";

interface ExampleCard {
  id: string;
  topic: string;
  title: string;
  url: string;
  domain: string;
  headline: string;
  description: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  videoSrc?: string;
}

const EXAMPLES: ExampleCard[] = [
  {
    id: "ego",
    topic: "Ego",
    title: '"Ego"',
    url: "https://www.egobarbers.co.uk > book-online",
    domain: "Ego Barbers",
    headline: "Barbershop | Aiza Khiljee Barbers | Unit...",
    description:
      "Ego Barbers in Cockfosters, North London. Walk-ins welcome six days a week, late opening on Thursdays until nine. Book your next cut at Ego online in under a minute.",
    aspectRatio: "16:9",
    resolution: "4K",
    videoSrc: "/previews/animation-1.mp4",
  },
  {
    id: "messi",
    topic: "Lionel Messi",
    title: '"Lionel Messi"',
    url: "https://www.egobarbers.co.uk > book-online",
    domain: "Ego Barbers",
    headline: "Barbershop | Abdul Rehman Barbers | Un...",
    description:
      "Ego Barbers in Cockfosters, North London. Walk-ins welcome six days a week, late opening on Thursdays until nine. Book your next cut at Ego online in under a minute.",
    aspectRatio: "9:16",
    resolution: "1080p",
    videoSrc: "/previews/animation-2.mp4",
  },
  {
    id: "discipline",
    topic: "Discipline",
    title: '"Discipline"',
    url: "https://www.egobarbers.co.uk > book-online",
    domain: "Ego Barbers",
    headline: "Barbershop | Abdul Rehman Barbers | Un...",
    description:
      "Ego Barbers in Cockfosters, North London. Walk-ins welcome six days a week, late opening on Thursdays until nine. Book your next cut at Ego online in under a minute.",
    aspectRatio: "1:1",
    resolution: "4K",
    videoSrc: "/previews/animation-3.mp4",
  },
];

const SUGGESTIONS = ["Lionel Messi", "Growth", "Taylor Swift", "AI"];

export default function MatchCutPage() {
  const {
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    durationInSeconds,
    isGenerating,
    progressStep,
    progress,
    outputUrl,
    handleGenerate,
    handleSelectSuggestion,
    handleReset,
    handleDownload,
  } = useMatchCutLogic();

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full bg-background text-foreground px-4 sm:px-6 py-12 md:py-18 overflow-hidden antialiased flex flex-col justify-between">
      <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 flex flex-col items-center">
        {/* Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            {outputUrl ? "Your Match Cut is Ready!" : "What's your video about?"}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground font-normal">
            {outputUrl ? (
              <>
                Custom match cut generated for{" "}
                <span className="text-white font-medium">&ldquo;{prompt}&rdquo;</span>
              </>
            ) : (
              <>
                One topic in, one{" "}
                <span className="bg-gradient-to-r from-[#1A73E8] via-[#3B82F6] to-[#5EB5FC] bg-clip-text text-transparent font-medium">
                  match cut
                </span>{" "}
                out.
              </>
            )}
          </p>
        </div>

        {outputUrl ? (
          <MatchCutReadyCard
            outputUrl={outputUrl}
            topic={prompt}
            durationInSeconds={durationInSeconds}
            aspectRatio={aspectRatio}
            resolution={resolution}
            onDownload={handleDownload}
            onRegenerate={() => handleGenerate()}
            onEditTopic={handleReset}
            isRegenerating={isGenerating}
          />
        ) : (
          <>
            {/* Input & Controls Box */}
            <form
              onSubmit={handleGenerate}
              className="w-full max-w-2xl rounded-2xl border border-border bg-[#1F1F1F] p-3.5 sm:p-4.5 backdrop-blur-md transition-all shadow-xl"
            >
              {/* Top Row: Search Input & Generate CTA */}
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-muted-foreground shrink-0 ml-1.5" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type a name, brand or idea..."
                  disabled={isGenerating}
                  className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder-muted-foreground outline-none border-none ring-0 py-1 disabled:opacity-60"
                />
                <ShimmerButton
                  type="submit"
                  disabled={isGenerating}
                  variant="primary"
                  size="sm"
                  className="shrink-0 font-semibold uppercase tracking-wider"
                >
                  <span>
                    {isGenerating
                      ? progressStep === "rendering"
                        ? "Rendering..."
                        : "Generating..."
                      : "Generate"}
                  </span>
                </ShimmerButton>
              </div>

              {/* Bottom Controls: Aspect Ratio + Resolution */}
              <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between flex-wrap gap-3">
                {/* Aspect Ratio Group */}
                <div className="flex items-center gap-1.5">
                  {/* 16:9 */}
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setAspectRatio("16:9")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                      aspectRatio === "16:9"
                        ? "border border-primary bg-primary/20 text-white"
                        : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <svg
                      className="w-3.5 h-2.5 shrink-0"
                      viewBox="0 0 16 9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="1" y="1" width="14" height="7" rx="1.5" />
                    </svg>
                    <span>16:9</span>
                  </button>

                  {/* 9:16 */}
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setAspectRatio("9:16")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                      aspectRatio === "9:16"
                        ? "border border-primary bg-primary/20 text-white"
                        : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <svg
                      className="w-2.5 h-3.5 shrink-0"
                      viewBox="0 0 9 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="1" y="1" width="7" height="14" rx="1.5" />
                    </svg>
                    <span>9:16</span>
                  </button>

                  {/* 1:1 */}
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setAspectRatio("1:1")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                      aspectRatio === "1:1"
                        ? "border border-primary bg-primary/20 text-white "
                        : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <svg
                      className="w-3 h-3 shrink-0"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="1" y="1" width="10" height="10" rx="1.5" />
                    </svg>
                    <span>1:1</span>
                  </button>
                </div>

                {/* Resolution Group */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setResolution("4K")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                      resolution === "4K"
                        ? "border border-primary bg-primary/20 text-white"
                        : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    4K
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setResolution("1080p")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                      resolution === "1080p"
                        ? "border border-primary bg-primary/20 text-white"
                        : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    1080p
                  </button>
                </div>
              </div>

              {/* Real-time Rendering Progress Bar */}
              {isGenerating && (
                <div className="mt-4 pt-3 border-t border-white/[0.07] animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
                      {progressStep === "generating"
                        ? "Generating match cut search cuts..."
                        : "Rendering Remotion video..."}
                    </span>
                    <span className="font-mono">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1A73E8] to-[#5EB5FC] transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Suggestion Chips */}
            <div className="mt-5 flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleSelectSuggestion(item)}
                  className="px-3.5 py-1.5 rounded-full border border-border bg-[#1F1F1F] text-sm text-foreground hover:text-white hover:bg-white/[0.08] hover:border-border transition-all cursor-pointer disabled:opacity-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Made with Match Cut Section */}
        <div className="mt-16 sm:mt-20 w-full">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
              Made with Match Cut
            </h2>
          </div>

          {/* 3 Showcase Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {EXAMPLES.map((example) => (
              <div
                key={example.id}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#121316] overflow-hidden hover:border-white/25 transition-all duration-300"
              >
                {/* Search result scene visual */}
                <div className="relative aspect-video w-full bg-[#0d0e11] p-4 flex flex-col justify-start overflow-hidden select-none border-b border-white/5">
                  {/* Blurred top text hint */}
                  <div className="text-[11px] text-zinc-600 line-clamp-1 filter blur-[1.5px] opacity-60">
                    have whole distinction and it takes years to learn.
                  </div>

                  {/* Favicon & URL */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-zinc-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-medium leading-none">
                        {example.domain}
                      </span>
                      <span className="text-[9px] text-zinc-500 leading-tight">
                        {example.url}
                      </span>
                    </div>
                  </div>

                  {/* Headline in Google-blue */}
                  <h3 className="mt-2 text-sm sm:text-base font-semibold text-[#1A73E8] group-hover:text-[#5EB5FC] transition-colors line-clamp-1">
                    {example.headline}
                  </h3>

                  {/* Snippet */}
                  <p className="mt-1 text-[10px] sm:text-[11px] text-zinc-400 leading-snug line-clamp-2">
                    {example.description}
                  </p>
                </div>

                {/* Bottom Metadata bar */}
                <div className="px-4 py-3 bg-[#121316] flex items-center justify-between text-xs">
                  <span className="font-semibold text-white tracking-wide">
                    {example.title}
                  </span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    {example.aspectRatio} · {example.resolution}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}