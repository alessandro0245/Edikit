import Link from "next/link";
import { templates } from "@/utils/constant";
import Card from "./Card";
import Video from "./Video";
import Prompt from "./Prompt";
import { Play, Sparkles, Zap, ArrowRight } from "lucide-react";

export default function Hero() {
  const featuredTemplates = templates.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <main>
        {true && (
          <section className="relative py-16 md:py-22 bg-background overflow-hidden">
          {/* Background SVG Decorations */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {/* Grid pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
              <defs>
                <pattern
                  id="hero-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>

            {/* Primary glow - top right */}
            <div className="absolute -top-40 -right-40 w-150 h-150 rounded-full bg-primary/10 blur-[120px] animate-hero-glow" />

            {/* Secondary glow - bottom left */}
            <div className="absolute -bottom-40 -left-40 w-125 h-125 rounded-full bg-purple-600/8 blur-[100px] animate-hero-glow-delayed" />

            {/* Center accent glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 rounded-full bg-primary/5 blur-[150px]" />

            {/* Floating decorative elements */}
            <svg
              className="absolute top-20 left-[10%] w-16 h-16 text-primary/15 animate-float"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>

            <svg
              className="absolute top-32 right-[15%] w-8 h-8 text-primary/20 animate-float-delayed"
              viewBox="0 0 32 32"
            >
              <path
                d="M16 4v24M4 16h24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <svg
              className="absolute top-1/2 left-[5%] w-20 h-20 text-primary/10 animate-float-slow"
              viewBox="0 0 80 80"
            >
              <circle cx="20" cy="20" r="3" fill="currentColor" />
              <circle cx="40" cy="15" r="2" fill="currentColor" />
              <circle cx="60" cy="25" r="3" fill="currentColor" />
              <circle cx="25" cy="50" r="2" fill="currentColor" />
              <circle cx="55" cy="55" r="3" fill="currentColor" />
            </svg>

            <svg
              className="absolute bottom-24 right-[8%] w-10 h-10 text-purple-500/15 animate-float-delayed"
              viewBox="0 0 40 40"
            >
              <rect
                x="10"
                y="10"
                width="20"
                height="20"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                transform="rotate(45 20 20)"
              />
            </svg>

            <svg
              className="absolute bottom-32 left-[18%] w-6 h-6 text-primary/20 animate-float"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>

            <svg
              className="absolute top-[40%] right-[3%] w-12 h-12 text-primary/10 animate-float-slow"
              viewBox="0 0 48 48"
            >
              <polygon
                points="24,8 42,40 6,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
              <div className="order-2 lg:order-1 relative h-full">
                <div
                  className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl"
                  aria-hidden="true"
                />
                <Video />
              </div>

              {/* Text Section - Right Side */}
              <div className="order-1 lg:order-2 space-y-8 px-3 py-2">
                <div className="space-y-5">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                    Make viral
                    <br className="hidden sm:block" /> production level
                    <br className="hidden sm:block" /> animations in{" "}
                    <span className="relative inline-block">
                      <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        seconds
                      </span>
                      <svg
                        className="absolute -bottom-2 left-0 w-full h-3 text-primary/40"
                        viewBox="0 0 200 12"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M2 8 Q50 2 100 7 T198 5"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    .
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                    Design professional motion graphics with stunning templates
                    or generate videos instantly using AI prompts. Customize
                    every detail and export high-quality videos.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/templates"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold bg-primary-gradient text-primary-foreground rounded-xl shadow-lg shadow-primary/25 transition-all  hover:-translate-y-0.5"
                  >
                    <Play className="w-5 h-5" />
                    Start Creating
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium border-2 border-border hover:border-primary/50 bg-background/50 text-foreground rounded-xl backdrop-blur-sm transition-all hover:bg-accent hover:-translate-y-0.5"
                  >
                    View Pricing
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-8 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">10+</p>
                      <p className="text-xs text-muted-foreground">Templates</p>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">AI</p>
                      <p className="text-xs text-muted-foreground">
                        Prompt to Video
                      </p>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-border hidden sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">2K</p>
                      <p className="text-xs text-muted-foreground">
                        Export Quality
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </section>
        )}

        <Prompt />
        {/* Templates Section */}
        <section className="py-16 md:py-24 bg-muted/30" id="templates">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center space-y-4 mb-16 md:mb-20">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
                  Templates designed for creators
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                  Every template is professionally crafted by motion designers.
                  Customize text, colors, and logos, then export instantly. No
                  animation experience needed.
                </p>
              </div>

              <div className="grid gap-8 mb-12">
                {/* Three Column Layout for Desktop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Side Card */}
                  <div className="md:col-span-1">
                    <Card {...featuredTemplates[0]} />
                  </div>

                  {/* Center Featured Card - Larger */}
                  <div className="md:col-span-1 md:scale-110 md:origin-center">
                    <Card {...featuredTemplates[1]} isFeatured={true} />
                  </div>

                  {/* Right Side Card */}
                  <div className="md:col-span-1">
                    <Card {...featuredTemplates[2]} />
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center pt-8">
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium border-2 border-border hover:border-primary bg-background text-foreground hover:bg-accent rounded-lg transition-all hover:scale-105"
                >
                  Browse All Templates
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
