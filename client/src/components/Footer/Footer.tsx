"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function SimpleFooter() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute) return null;

  return (
    <footer className="w-full text-foreground border-t border-border/40 bg-background backdrop-blur-md py-4 mt-auto">
      <div className="container mx-auto px-6 max-w-350 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground font-medium select-none tracking-normal">
        {/* Left Side: Brand Logo & Copyright unified in one block */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo.png"
            alt="Edikit"
            width={75}
            height={28}
            className="object-contain opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
            priority
          />
          <div className="h-3 w-px bg-border/60" />
          <span className="font-mono tabular-nums text-muted-foreground/80">
            &copy; {currentYear} Edikit. All rights reserved.
          </span>
        </div>

        {/* Right Side: Quick Action & Policy Navigation Anchors */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-6 shrink-0">
          <Link
            href="https://www.iubenda.com/privacy-policy/82026734"
            className="hover:text-foreground transition-colors font-normal"
          >
            Privacy Policy
          </Link>
          <Link
            href="https://www.iubenda.com/privacy-policy/82026734/cookie-policy"
            className="hover:text-foreground transition-colors font-normal"
          >
            Cookie Policy
          </Link>
          {/* iubenda binds this class to open the privacy/cookie preferences
              panel — covers GDPR consent + US (CCPA/CPRA) sale/sharing opt-out */}
          <button
            type="button"
            className="iubenda-cs-preferences-link hover:text-foreground transition-colors font-normal cursor-pointer"
          >
            Your Privacy Choices
          </button>
          {/* iubenda binds this class to open the US "Notice at Collection" */}
          <button
            type="button"
            className="iubenda-cs-uspr-link hover:text-foreground transition-colors font-normal cursor-pointer"
          >
            Notice at Collection
          </button>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors font-normal"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
