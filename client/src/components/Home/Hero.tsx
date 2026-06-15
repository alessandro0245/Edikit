"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import ShimmerButton from "../ShimmerButton/ShimmerButton";

const RESPECT_REDUCED_MOTION = false;

interface Template {
  src?: string;
  poster?: string;
  label: string;
}

const TEMPLATES: Template[] = [
  { src: "", poster: "", label: "TEMPLATE 01" },
  { src: "", poster: "", label: "TEMPLATE 02" },
  { src: "", poster: "", label: "TEMPLATE 03" },
  { src: "", poster: "", label: "TEMPLATE 04" },
  { src: "", poster: "", label: "TEMPLATE 05" },
];

interface CardSlot {
  fx: number;
  fy: string;
  fr: string;
  fxM?: number;
  fyM?: string;
  frM?: string;
  z: number;
  isHero?: boolean;
}

const CARD_SLOTS: CardSlot[] = [
  { fx: -1.6, fy: "30px", fr: "-14deg", z: 1 },
  { fx: -0.85, fy: "8px", fr: "-7deg", z: 2 },
  { fx: 0, fy: "0px", fr: "0deg", z: 3 },
  { fx: 0.85, fy: "8px", fr: "7deg", z: 4 },
  {
    fx: 1.6,
    fy: "30px",
    fr: "14deg",
    fxM: 0.85,
    fyM: "8px",
    frM: "7deg",
    z: 5,
    isHero: true,
  },
];

export default function EdikitHero() {
  const heroRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const reduced =
      RESPECT_REDUCED_MOTION &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    hero.classList.add("ek-anim");
    if (reduced) hero.classList.add("ek-reduced");

    const videos = deckRef.current?.querySelectorAll("video") ?? [];

    if (reduced || !("IntersectionObserver" in window)) {
      hero.classList.add("ek-on");
    } else {
      // Trigger animation immediately on mount (reload/refresh)
      hero.classList.add("ek-on");
      videos.forEach((v) => v.play().catch(() => {}));
    }
  }, []);

  return (
    <>
      <style>{`
        :root {
          --ek-blue:  #1A73E8;
          --ek-blue-2:#5EB5FC;
          --ek-cardw: clamp(115px, 15.5vw, 185px);
        }

        /* ── Card base: CSS-variable positioning so keyframes can reference --x/--y/--r ── */
        .ek-card {
          --x: calc(var(--fx) * var(--ek-cardw));
          --y: var(--fy);
          --r: var(--fr);
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--ek-cardw);
          aspect-ratio: 1 / 1;
          border-radius: clamp(12px, 1.6vw, 18px);
          overflow: hidden;
          background: #232323;
          transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(var(--r));
          z-index: var(--z);
          will-change: transform, opacity;
        }

        /* ── Pre-animation: JS adds .ek-anim, then .ek-on to trigger ── */
        .ek-anim .ek-word { opacity: 0; }
        .ek-anim .ek-sub  { opacity: 0; }
        .ek-anim .ek-cta  { opacity: 0; }
        .ek-anim .ek-card { opacity: 0; }

        /* ── Word entrance ── */
        @keyframes ek-word {
          from { opacity: 0; filter: blur(6px); transform: translateY(5px); }
          to   { opacity: 1; filter: blur(0);   transform: translateY(0); }
        }
        .ek-on .ek-word {
          animation: ek-word .9s cubic-bezier(.22,.55,.25,1) both;
          animation-delay: calc(.05s + var(--w) * .11s);
        }

        /* ── Hero card: rises from below, tilted, then fans to its slot ── */
        @keyframes ek-heroFly {
          0%   { transform: translate(-50%, 200%) rotate(-21deg) scale(1.2);
                 opacity: 0;
                 animation-timing-function: cubic-bezier(.16,.6,.25,1); }
          15%  { opacity: 0; }
          27%  { opacity: 1; }
          62%  { transform: translate(-50%, -50%) rotate(0deg) scale(1);
                 animation-timing-function: cubic-bezier(.5,.08,.3,1); }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(var(--r)) scale(1);
                 opacity: 1; }
        }
        .ek-on .ek-card--hero {
          animation: ek-heroFly 1.9s linear forwards;
        }

        /* ── Satellite cards burst from centre to their slots ── */
        @keyframes ek-burst {
          0%   { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0; }
          6%   { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(var(--r)) scale(1); opacity: 1; }
        }
        .ek-on .ek-card:not(.ek-card--hero) {
          animation: ek-burst .6s cubic-bezier(.35,.1,.25,1) both;
          animation-delay: calc(1.17s + (3 - var(--i)) * 60ms);
        }

        /* ── Subtitle + CTA fade in ── */
        @keyframes ek-fade { to { opacity: 1; } }
        .ek-on .ek-sub { animation: ek-fade .7s ease 1.45s forwards; }
        .ek-on .ek-cta { animation: ek-fade .7s ease 1.65s forwards; }

        /* ── Placeholder gradient animation ── */
        @keyframes ek-drift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        /* ── Subtle brightness on hover (pointer devices only) ── */
        @media (hover: hover) {
          .ek-card { transition: filter .3s ease; }
          .ek-card:hover { filter: brightness(1.04); }
        }

        /* ── Reduced motion ── */
        .ek-reduced * {
          animation-duration: .01ms !important;
          animation-delay: 0s !important;
        }

        /* ── Mobile: 3 cards, CSS-variable mobile overrides ── */
        @media (max-width: 640px) {
          .ek-card[data-i="0"],
          .ek-card[data-i="3"] { display: none; }
          :root { --ek-cardw: clamp(110px, 27vw, 140px); }
          .ek-deck { height: clamp(160px, 44vw, 210px) !important; margin-bottom: 26px !important; }
          .ek-card {
            --x: calc(var(--fx-m, var(--fx)) * var(--ek-cardw));
            --y: var(--fy-m, var(--fy));
            --r: var(--fr-m, var(--fr));
          }
        }
      `}</style>

      <section
        ref={heroRef}
        className="relative text-foreground overflow-hidden text-center antialiased"
        style={{
          padding: "clamp(56px,9vh,88px) 24px clamp(26px,4vh,40px)",
          background: "#191919",
        }}
      >
        {/* Blue radial glow — brand spotlight at top center */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          // style={{
          //   background:
          //     "radial-gradient(ellipse 85% 55% at 50% -5%, rgba(26,115,232,0.18) 0%, transparent 100%)",
          // }}
        />
        <div className="relative max-w-245 mx-auto">
          {/* ── Headline ── */}
          <h1
            className="font-semibold leading-[1.1] tracking-[-0.01em] mx-auto max-w-[20ch]"
            style={{ fontSize: "clamp(2rem,5vw,3.8rem)" }}
          >
            <span className="block">
              {["Pro", "motion", "graphics"].map((word, i) => (
                <span
                  key={word}
                  className="ek-word inline-block"
                  style={{
                    ["--w" as string]: i,
                    willChange: "opacity, filter, transform",
                  }}
                >
                  {word}
                  {i < 2 ? " " : ""}
                </span>
              ))}
            </span>
            <span className="block">
              <span
                className="ek-word inline-block"
                style={{
                  ["--w" as string]: 3,
                  willChange: "opacity, filter, transform",
                }}
              >
                in&nbsp;
              </span>
              <span
                className="ek-word inline-block"
                style={{
                  ["--w" as string]: 4,
                  willChange: "opacity, filter, transform",
                }}
              >
                <em
                  className="not-italic"
                  style={{
                    background: "linear-gradient(92deg, #1A73E8, #5EB5FC)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  2 clicks.
                </em>
              </span>
            </span>
          </h1>

          {/* ── Card deck ── */}
          <div
            ref={deckRef}
            className="ek-deck relative mx-auto max-w-230"
            style={{
              height: "clamp(150px,20.5vw,250px)",
              margin: "clamp(8px,1.2vh,14px) auto clamp(48px,7vh,58px)",
            }}
          >
            {TEMPLATES.map((tpl, i) => {
              const slot = CARD_SLOTS[i];
              const cssVars: Record<string, string | number> = {
                "--fx": slot.fx,
                "--fy": slot.fy,
                "--fr": slot.fr,
                "--z": slot.z,
                "--i": i,
              };
              if (slot.fxM !== undefined) cssVars["--fx-m"] = slot.fxM;
              if (slot.fyM !== undefined) cssVars["--fy-m"] = slot.fyM;
              if (slot.frM !== undefined) cssVars["--fr-m"] = slot.frM;

              return (
                <div
                  key={i}
                  className={`ek-card${slot.isHero ? " ek-card--hero" : ""}`}
                  data-i={i}
                  style={cssVars as React.CSSProperties}
                >
                  {tpl.src ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="metadata"
                      poster={tpl.poster}
                      src={tpl.src}
                      onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 grid place-items-center font-bold text-[0.72rem] tracking-[0.06em] text-white"
                      style={{
                        background:
                          i % 2 === 1
                            ? "linear-gradient(315deg, #1A73E8, #5EB5FC)"
                            : "linear-gradient(135deg, #1A73E8, #5EB5FC)",
                        backgroundSize: "220% 220%",
                        animation: "ek-drift 7s ease-in-out infinite",
                      }}
                    >
                      {tpl.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Subtitle ── */}
          <p
            className="ek-sub max-w-[46ch] mx-auto leading-[1.55] text-[#CFCFCF]"
            style={{ fontSize: "clamp(.88rem,1.5vw,1rem)" }}
          >
            Pick a template, customize text and colors in your browser and
            download the rendered video. That&apos;s it.
          </p>

          {/* ── CTA ── */}
          <div
            className="ek-cta flex gap-3.5 justify-center items-center flex-wrap"
            style={{ marginTop: "clamp(14px,2vh,20px)" }}
          >
            {/* <Link
              href="/pricing"
              className="font-semibold text-[.92rem] rounded-full px-[1.6em] py-[.8em] text-white cursor-pointer no-underline inline-block transition-[transform,box-shadow] duration-200 ease-in-out hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#5EB5FC]"
              style={{
                background: "linear-gradient(92deg, #1A73E8, #5EB5FC)",
              }}
            
            >
              See pricing
            </Link> */}
            <ShimmerButton
              href="/pricing"
              variant="primary"
              size="md"
              className="uppercase tracking-wider"
            >
              See pricing
            </ShimmerButton>
            <Link
              href="#templates"
              className="font-semibold text-[.92rem] rounded-full px-[1.6em] py-[.8em] text-foreground bg-transparent cursor-pointer no-underline inline-block  focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#5EB5FC] border border-primary/50 transition-[background-color,color,box-shadow] duration-200 ease-in-out hover:bg-primary/10"
            >
              Explore templates
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
