"use client";

import {
  useRef,
  useEffect,
  useCallback,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";

// ─── Animation constants ──────────────────────────────────────────────────────
// Each blob travels along a smooth organic path = sum of two sine waves.
// [amplitude, frequency, phase]

type SineParam = [number, number, number];

interface BlobConfig {
  cx: number; // centre X (%)
  cy: number; // centre Y (%)
  sx: SineParam[]; // X sine params
  sy: SineParam[]; // Y sine params
}

const BLOBS: BlobConfig[] = [
  { cx: 50, cy: 50, sx: [[30, 1.19, 0.0], [16, 2.21, 1.7]], sy: [[26, 1.45, 2.1], [13, 2.64, 0.4]] },
  { cx: 50, cy: 50, sx: [[28, 1.05, 2.6], [17, 2.01, 0.9]], sy: [[24, 1.62, 1.2], [14, 2.41, 3.0]] },
  { cx: 50, cy: 50, sx: [[29, 1.33, 1.1], [15, 2.13, 2.4]], sy: [[25, 1.22, 0.7], [13, 2.75, 1.9]] },
  { cx: 50, cy: 50, sx: [[31, 1.12, 3.1], [16, 1.87, 0.3]], sy: [[27, 1.50, 2.8], [12, 2.52, 1.4]] },
];

const BLOB_ALPHAS: [number, number, number, number] = [0.88, 0.84, 0.88, 0.84];

// ─── Pure animation utilities ─────────────────────────────────────────────────

function clamp(v: number, min = 6, max = 94): number {
  return v < min ? min : v > max ? max : v;
}

function wave(params: SineParam[], t: number): number {
  return params.reduce((sum, [amp, freq, phase]) => sum + amp * Math.sin(freq * t + phase), 0);
}

function buildBackground(positions: { x: number; y: number }[]): string {
  return positions
    .map(
      ({ x, y }, i) =>
        `radial-gradient(circle at ${x.toFixed(2)}% ${y.toFixed(2)}%, rgba(94,181,252,${BLOB_ALPHAS[i]}) 0%, rgba(94,181,252,0) 31%)`
    )
    .join(", ");
}

// ─── Animation hook ───────────────────────────────────────────────────────────

function useBlobAnimation(
  containerRef: React.RefObject<HTMLElement | null>,
  blobRef: React.RefObject<HTMLDivElement | null>
) {
  const rafRef    = useRef<number | null>(null);
  const mixRef    = useRef(0);
  const targetRef = useRef(0);

  const frame = useCallback(
    (now: number) => {
      const blob = blobRef.current;
      if (!blob) return;

      const t = now / 1000;
      // Soft fade in / out
      mixRef.current += (targetRef.current - mixRef.current) * 0.07;

      const positions = BLOBS.map((b) => ({
        x: clamp(b.cx + wave(b.sx, t)),
        y: clamp(b.cy + wave(b.sy, t)),
      }));

      blob.style.background = buildBackground(positions);
      blob.style.opacity = mixRef.current.toFixed(3);

      // Stop the loop once the effect has fully faded out
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
  }, [containerRef, startLoop]);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonSize    = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary";

interface BaseProps {
  children:  ReactNode;
  size?:     ButtonSize;
  variant?:  ButtonVariant;
  className?: string;
}

interface AsButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  href?: never;
}

interface AsLinkProps extends BaseProps {
  href:     string;
  target?:  string;
  rel?:     string;
  disabled?: boolean;
}

export type EdikitButtonProps = AsButtonProps | AsLinkProps;

// ─── Style maps ───────────────────────────────────────────────────────────────

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-[14px] py-2.5 text-xs tracking-widest",
  md: "px-[46px] py-4 text-[15px] tracking-[1px]",
  lg: "px-14 py-5 text-base tracking-[1px]",
};

// variant → base gradient
const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(105deg, #1A73E8 0%, #5EB5FC 100%)",
  },
  secondary: {
    background: "linear-gradient(105deg, #0B3C8C 0%, #1A73E8 100%)",
  },
};

// ─── Shared inner markup ──────────────────────────────────────────────────────

interface InnerProps extends BaseProps {
  blobRef: React.RefObject<HTMLDivElement | null>;
}

function ButtonInner({ children, size = "md", variant = "primary", className = "", blobRef }: InnerProps) {
  return (
    <span
      className={[
        // layout & shape
        "relative inline-flex items-center justify-center",
        "rounded-full overflow-hidden",
        "font-semibold uppercase cursor-pointer select-none",
        "text-white border-none",
        // transition for transform only (background handled by JS)
        "transition-transform duration-200 ease-out",
        "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        sizeClasses[size],
        className,
      ].join(" ")}
      style={variantStyle[variant]}
    >
      {/* Animated blob layer — driven by rAF, fades in on hover */}
      <div
        ref={blobRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
      />

      {/* Label */}
      <span className="relative z-10">{children}</span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EdikitButton(props: EdikitButtonProps) {
  const containerRef = useRef<HTMLElement>(null);
  const blobRef      = useRef<HTMLDivElement>(null);

  useBlobAnimation(containerRef, blobRef);

  const { children, size, variant, className } = props;
  const innerProps = { children, size, variant, className, blobRef };

  // ── Render as Next.js Link ──────────────────────────────────────────────────
  if ("href" in props && props.href !== undefined) {
    const { href, target, rel, disabled } = props as AsLinkProps;
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        aria-disabled={disabled}
        ref={containerRef as React.RefObject<HTMLAnchorElement>}
        className={[
          "inline-block rounded-full",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[#5EB5FC] focus-visible:ring-offset-2",
          disabled ? "pointer-events-none opacity-50" : "",
        ].join(" ")}
      >
        <ButtonInner {...innerProps} />
      </Link>
    );
  }

  // ── Render as <button> ──────────────────────────────────────────────────────
  const { disabled, onClick, type = "button", ...rest } = props as AsButtonProps;
  return (
    <button
      ref={containerRef as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-block rounded-full bg-transparent border-none p-0",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#5EB5FC] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
      ].join(" ")}
      {...rest}
    >
      <ButtonInner {...innerProps} />
    </button>
  );
}