"use client";

import {
  useRef,
  useEffect,
  useCallback,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";

// ─── Blob animation (primary only) ───────────────────────────────────────────

type SineParam = [number, number, number];

interface BlobConfig {
  cx: number;
  cy: number;
  sx: SineParam[];
  sy: SineParam[];
}

const BLOBS: BlobConfig[] = [
  { cx: 50, cy: 50, sx: [[30,1.19,0.0],[16,2.21,1.7]], sy: [[26,1.45,2.1],[13,2.64,0.4]] },
  { cx: 50, cy: 50, sx: [[28,1.05,2.6],[17,2.01,0.9]], sy: [[24,1.62,1.2],[14,2.41,3.0]] },
  { cx: 50, cy: 50, sx: [[29,1.33,1.1],[15,2.13,2.4]], sy: [[25,1.22,0.7],[13,2.75,1.9]] },
  { cx: 50, cy: 50, sx: [[31,1.12,3.1],[16,1.87,0.3]], sy: [[27,1.50,2.8],[12,2.52,1.4]] },
];

const BLOB_ALPHAS: [number, number, number, number] = [0.88, 0.84, 0.88, 0.84];

function clamp(v: number, min = 6, max = 94) {
  return v < min ? min : v > max ? max : v;
}
function wave(params: SineParam[], t: number) {
  return params.reduce((s, [a, f, p]) => s + a * Math.sin(f * t + p), 0);
}
function buildBackground(pos: { x: number; y: number }[]) {
  return pos
    .map(({ x, y }, i) =>
      `radial-gradient(circle at ${x.toFixed(2)}% ${y.toFixed(2)}%, rgba(94,181,252,${BLOB_ALPHAS[i]}) 0%, rgba(94,181,252,0) 31%)`
    )
    .join(", ");
}

function useBlobAnimation(
  containerRef: React.RefObject<HTMLElement | null>,
  blobRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  const rafRef    = useRef<number | null>(null);
  const mixRef    = useRef(0);
  const targetRef = useRef(0);

  const frame = useCallback(
    (now: number) => {
      const blob = blobRef.current;
      if (!blob) return;
      const t = now / 1000;
      mixRef.current += (targetRef.current - mixRef.current) * 0.07;
      const positions = BLOBS.map((b) => ({
        x: clamp(b.cx + wave(b.sx, t)),
        y: clamp(b.cy + wave(b.sy, t)),
      }));
      blob.style.background = buildBackground(positions);
      blob.style.opacity = mixRef.current.toFixed(3);
      if (targetRef.current === 0 && mixRef.current < 0.004) {
        blob.style.opacity = "0";
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    },
    [blobRef]
  );

  const startLoop = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(frame);
  }, [frame]);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;
    const onEnter = () => { targetRef.current = 1; startLoop(); };
    const onLeave = () => { targetRef.current = 0; startLoop(); };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("touchstart",   onEnter, { passive: true });
    el.addEventListener("touchend",     onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("touchstart",   onEnter);
      el.removeEventListener("touchend",     onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, startLoop, enabled]);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonSize    = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary";

interface BaseProps {
  children:   ReactNode;
  size?:      ButtonSize;
  variant?:   ButtonVariant;
  width?: string;           // any Tailwind width class e.g. "w-full" "w-64" "w-1/2"
  className?: string;
}

interface AsButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  href?: never;
}

interface AsLinkProps extends BaseProps {
  href:      string;
  target?:   string;
  rel?:      string;
  disabled?: boolean;
}

export type EdikitButtonProps = AsButtonProps | AsLinkProps;

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-[1.3em] py-[.65em] text-[.82rem]",
  md: "px-[1.6em] py-[.8em]  text-[.92rem]",
  lg: "px-[2.0em] py-[1.0em] text-[1rem]",
};

// ─── Primary inner ────────────────────────────────────────────────────────────

function PrimaryInner({
  children,
  size = "md",
  width = "",
  className = "",
  blobRef,
}: BaseProps & { blobRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <span
      className={[
        "relative inline-flex items-center justify-center",
        "rounded-full overflow-hidden font-semibold uppercase tracking-[1px]",
        "text-white cursor-pointer select-none",
        "transition-transform duration-200 ease-out",
        "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        width,
        sizeClasses[size],
        className,
      ].join(" ")}
      style={{ background: "linear-gradient(105deg, #1A73E8 0%, #5EB5FC 100%)" }}
    >
      <div
        ref={blobRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </span>
  );
}

// ─── Secondary inner ──────────────────────────────────────────────────────────
// Matches the "Explore templates" link style:
// transparent bg, border border-primary/50, hover:bg-primary/10

function SecondaryInner({
  children,
  size = "md",
  width = "",
  className = "",
}: BaseProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center",
        "rounded-full font-semibold cursor-pointer select-none no-underline",
        // Match "Explore templates" exactly
        "text-foreground bg-transparent",
        "border border-primary/50",
        "transition-[background-color,color,box-shadow,transform] duration-200 ease-in-out",
        "hover:bg-primary/10 hover:-translate-y-0.5",
        "hover:shadow-[0_0_14px_2px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]",
        "active:translate-y-0 active:scale-[0.98] active:shadow-none",
        "focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#5EB5FC]",
        width,
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-2">
        {children}
      </span>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EdikitButton(props: EdikitButtonProps) {
  const containerRef = useRef<HTMLElement>(null);
  const blobRef      = useRef<HTMLDivElement>(null);
  const variant      = props.variant ?? "primary";
  const isPrimary    = variant === "primary";
  const width        = props.width ?? "";

  useBlobAnimation(containerRef, blobRef, isPrimary);

  const { children, size, className } = props;

  function renderInner() {
    return variant === "secondary" ? (
      <SecondaryInner size={size} width={width} className={className}>
        {children}
      </SecondaryInner>
    ) : (
      <PrimaryInner size={size} width={width} className={className} blobRef={blobRef}>
        {children}
      </PrimaryInner>
    );
  }

  // If a width class is passed, switch wrapper to block so width takes effect
  const isBlock = width.includes("w-");
  const wrapperClass = [
    isBlock ? "block" : "inline-block",
    "rounded-full",
    "focus-visible:outline-none",
    width,
  ].join(" ");

  // ── As Link ────────────────────────────────────────────────────────────────
  if ("href" in props && props.href !== undefined) {
    const { href, target, rel, disabled } = props as AsLinkProps;
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        aria-disabled={disabled}
        ref={containerRef as React.RefObject<HTMLAnchorElement>}
        className={[wrapperClass, disabled ? "pointer-events-none opacity-50" : ""].join(" ")}
      >
        {renderInner()}
      </Link>
    );
  }

  // ── As button ──────────────────────────────────────────────────────────────
  const { disabled, onClick, type = "button", ...rest } = props as AsButtonProps;
  return (
    <button
      ref={containerRef as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        wrapperClass,
        "bg-transparent border-none p-0",
        "disabled:pointer-events-none disabled:opacity-50",
      ].join(" ")}
      {...rest}
    >
      {renderInner()}
    </button>
  );
}