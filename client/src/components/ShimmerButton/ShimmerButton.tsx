"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost";

interface BaseProps {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
}

interface AsButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  href?: never;
}

interface AsLinkProps extends BaseProps {
  href: string;
  target?: string;
  rel?: string;
  disabled?: never;
}

type GlowButtonProps = AsButtonProps | AsLinkProps;

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm gap-1.5",
  md: "px-6 py-2.5 text-sm gap-2",
  lg: "px-8 py-3.5 text-base gap-2.5",
};

// variant → CSS class (defined in globals.css)
const variantClass: Record<ButtonVariant, string> = {
  primary:   "glow-btn glow-btn--primary",
  secondary: "glow-btn glow-btn--secondary",
  ghost:     "glow-btn glow-btn--ghost",
};

function ButtonInner({
  children,
  size = "md",
  variant = "primary",
  className = "",
}: BaseProps) {
  return (
    <span
      className={[
        "relative inline-flex items-center justify-center",
        "font-semibold rounded-full overflow-hidden",
        "transition-[box-shadow,transform] duration-300 ease-out",
        sizeClasses[size],
        variantClass[variant],
        className,
      ].join(" ")}
    >
      <span className="relative z-10 inline-flex items-center gap-[inherit]">
        {children}
      </span>
    </span>
  );
}

export default function GlowButton(props: GlowButtonProps) {
  const { children, size, variant, className } = props;
  const innerProps = { children, size, variant, className };

  if ("href" in props && props.href !== undefined) {
    const { href, target, rel } = props as AsLinkProps;
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className="inline-block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5EB5FC] focus-visible:ring-offset-2"
      >
        <ButtonInner {...innerProps} />
      </Link>
    );
  }

  const { disabled, onClick, type = "button", ...rest } = props as AsButtonProps;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5EB5FC] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
      {...rest}
    >
      <ButtonInner {...innerProps} />
    </button>
  );
}