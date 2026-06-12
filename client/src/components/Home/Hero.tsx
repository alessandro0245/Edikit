"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/* ─── Types ─── */
interface Template {
  src?: string;
  poster?: string;
  label: string;
}

interface CardProps {
  template: Template;
  index: number;
  isHero?: boolean;
  style: React.CSSProperties;
}

/* ─── Config ─── */

/**
 * Set to true in production to respect the user's "Reduce Motion" OS setting.
 * Set to false during development to always see the animation.
 */
const RESPECT_REDUCED_MOTION = false;

/**
 * Replace src/poster with your 5 square looping videos (.mp4 / .webm).
 * Leave src empty to show the animated gradient placeholder.
 */
const TEMPLATES: Template[] = [
  { src: "", poster: "", label: "TEMPLATE 01" },
  { src: "", poster: "", label: "TEMPLATE 02" },
  { src: "", poster: "", label: "TEMPLATE 03" },
  { src: "", poster: "", label: "TEMPLATE 04" },
  { src: "", poster: "", label: "TEMPLATE 05" },
];

/* ─── Sub-components ─── */

function CardPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center font-bold text-[0.72rem] tracking-[0.06em] text-white"
      style={{
        background: "linear-gradient(135deg, #1A73E8, #5EB5FC)",
        backgroundSize: "220% 220%",
        animation: "ek-drift 7s ease-in-out infinite",
      }}
    >
      {label}
    </div>
  );
}

function Card({ template, index, isHero = false, style }: CardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = () => video.play().catch(() => {});
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, []);

  return (
    <div
      className={`ek-card absolute overflow-hidden bg-white${isHero ? " ek-card--hero" : ""}`}
      style={{
        borderRadius: "clamp(12px, 1.6vw, 18px)",
        width: "var(--ek-cardw)",
        aspectRatio: "1 / 1",
        left: "50%",
        top: "50%",
        willChange: "transform, opacity",
        ...style,
      }}
      data-i={index}
    >
      {template.src ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          poster={template.poster}
          src={template.src}
        />
      ) : (
        <CardPlaceholder label={template.label} />
      )}
    </div>
  );
}

/* ─── Card layout config ─── */
const CARD_SLOTS: { x: string; y: string; r: string; z: number }[] = [
  { x: "calc(-1.6 * var(--ek-cardw))", y: "30px", r: "-14deg", z: 1 },
  { x: "calc(-0.85 * var(--ek-cardw))", y: "8px", r: "-7deg", z: 2 },
  { x: "0px", y: "0px", r: "0deg", z: 3 },
  { x: "calc(0.85 * var(--ek-cardw))", y: "8px", r: "7deg", z: 4 },
  { x: "calc(1.6 * var(--ek-cardw))", y: "30px", r: "14deg", z: 5 },
];

/* ─── Main component ─── */
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

    const play = () => {
      hero.classList.remove("ek-on");
      void hero.offsetWidth; // force reflow to restart animation
      hero.classList.add("ek-on");
    };

    const videos = deckRef.current?.querySelectorAll("video") ?? [];

    if (reduced || !("IntersectionObserver" in window)) {
      hero.classList.add("ek-on");
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              play();
              videos.forEach((v) => v.play().catch(() => {}));
            } else {
              hero.classList.remove("ek-on");
              videos.forEach((v) => v.pause());
            }
          });
        },
        { threshold: 0.25 }
      );
      observer.observe(hero);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <>
      {/* Keyframe animations injected once — Tailwind can't express these */}
      <style>{`
        :root {
          --ek-blue: #1A73E8;
          --ek-blue-2: #5EB5FC;
          --ek-cardw: clamp(115px, 15.5vw, 185px);
        }

        @keyframes ek-word {
          from { opacity: 0; filter: blur(6px); transform: translateY(5px); }
          to   { opacity: 1; filter: blur(0);   transform: translateY(0); }
        }
        @keyframes ek-fade { to { opacity: 1; } }
        @keyframes ek-drift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes ek-heroFly {
          0%   { transform: translate(-50%, 200%) rotate(-21deg) scale(1.2);
                 opacity: 1;
                 animation-timing-function: cubic-bezier(.16,.6,.25,1); }
          62%  { transform: translate(-50%, -50%) rotate(0deg) scale(1);
                 animation-timing-function: cubic-bezier(.5,.08,.3,1); }
          100% { transform: translate(calc(-50% + var(--slot-x)), calc(-50% + var(--slot-y))) rotate(var(--slot-r)) scale(1);
                 opacity: 1; }
        }
        @keyframes ek-burst {
          0%   { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0; }
          6%   { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--slot-x)), calc(-50% + var(--slot-y))) rotate(var(--slot-r)) scale(1); opacity: 1; }
        }

        /* Pre-animation hidden state */
        .ek-anim .ek-word      { opacity: 0; }
        .ek-anim .ek-sub       { opacity: 0; }
        .ek-anim .ek-cta       { opacity: 0; }
        .ek-anim .ek-card      { opacity: 0; }

        /* Animate on: words */
        .ek-on .ek-word {
          animation: ek-word .9s cubic-bezier(.22,.55,.25,1) both;
        }

        /* Animate on: hero card */
        .ek-on .ek-card--hero {
          animation: ek-heroFly 1.9s linear forwards;
        }

        /* Animate on: satellite cards */
        .ek-on .ek-card:not(.ek-card--hero) {
          animation: ek-burst .6s cubic-bezier(.35,.1,.25,1) both;
        }

        /* Animate on: subtitle + CTA */
        .ek-on .ek-sub { animation: ek-fade .7s ease 1.45s forwards; }
        .ek-on .ek-cta { animation: ek-fade .7s ease 1.65s forwards; }

        /* Reduced motion override */
        .ek-reduced * {
          animation-duration: .01ms !important;
          animation-delay: 0s !important;
        }

        /* Mobile: hide outermost cards */
        @media (max-width: 640px) {
          .ek-card[data-i="0"],
          .ek-card[data-i="3"] { display: none; }
          :root { --ek-cardw: clamp(110px, 27vw, 140px); }
        }
      `}</style>

      <section
        ref={heroRef}
        className="relative font-sans bg-background text-foreground overflow-hidden text-center antialiased"
        style={{ padding: "clamp(28px,4vh,44px) 24px clamp(26px,4vh,40px)" }}
      >
        <div className="relative max-w-245 mx-auto">

          {/* ── Headline ── */}
          <h1
            className="font-bold leading-[1.1] tracking-[-0.02em] mx-auto max-w-[20ch]"
            style={{ fontSize: "clamp(2rem,5vw,3.8rem)" }}
          >
            {/* Line 1: "Pro motion graphics" */}
            <span className="block">
              {["Pro", "motion", "graphics"].map((word, i) => (
                <span
                  key={word}
                  className="ek-word inline-block"
                  style={{
                    animationDelay: `calc(0.05s + ${i} * 0.11s)`,
                    willChange: "opacity, filter, transform",
                  }}
                >
                  {word}
                  {i < 2 ? "\u00A0" : ""}
                </span>
              ))}
            </span>

            {/* Line 2: "in 2 clicks." */}
            <span className="block">
              <span
                className="ek-word inline-block"
                style={{
                  animationDelay: "calc(0.05s + 3 * 0.11s)",
                  willChange: "opacity, filter, transform",
                }}
              >
                in&nbsp;
              </span>
              <span
                className="ek-word inline-block"
                style={{
                  animationDelay: "calc(0.05s + 4 * 0.11s)",
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
            className="relative mx-auto max-w-[920px]"
            style={{
              height: "clamp(150px,20.5vw,250px)",
              margin: "clamp(8px,1.2vh,14px) auto clamp(48px,7vh,58px)",
            }}
          >
            {TEMPLATES.map((tpl, i) => {
              const slot = CARD_SLOTS[i];
              const isHero = i === 4;

              return (
                <Card
                  key={i}
                  template={tpl}
                  index={i}
                  isHero={isHero}
                  style={{
                    // CSS custom props consumed by keyframes
                    ["--slot-x" as string]: slot.x,
                    ["--slot-y" as string]: slot.y,
                    ["--slot-r" as string]: slot.r,
                    zIndex: slot.z,
                    // Static resting position (no-JS fallback)
                    transform: `translate(calc(-50% + ${slot.x}), calc(-50% + ${slot.y})) rotate(${slot.r})`,
                    // Stagger delay for satellite cards
                    animationDelay: isHero
                      ? undefined
                      : `calc(1.17s + ${3 - i} * 60ms)`,
                  }}
                />
              );
            })}
          </div>

          {/* ── Subtitle ── */}
          <p
            className="ek-sub max-w-[46ch] mx-auto leading-[1.55] text-[#5A6475]"
            style={{ fontSize: "clamp(.88rem,1.5vw,1rem)" }}
          >
            Pick a template, customize text and colors in your browser, and
            download the rendered video. That&apos;s it.
          </p>

          {/* ── CTA ── */}
          <div
            className="ek-cta flex gap-[14px] justify-center items-center flex-wrap"
            style={{ marginTop: "clamp(14px,2vh,20px)" }}
          >
            <Link
              href="/pricing"
              className="font-semibold text-[.92rem] rounded-full px-[1.6em] py-[.8em] text-white border-0 cursor-pointer no-underline inline-block transition-[transform,box-shadow] duration-200 ease-in-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#5EB5FC]"
              style={{
                background: "linear-gradient(92deg, #1A73E8, #5EB5FC)",
                boxShadow: "0 12px 26px -10px rgba(26,115,232,.55)",
              }}
            >
              See pricing
            </Link>

            <Link
              href="#templates"
              className="font-semibold text-[.92rem] rounded-full px-[1.6em] py-[.8em] text-foreground bg-transparent border-0 cursor-pointer no-underline inline-block hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#5EB5FC]"
            >
              Explore templates
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}