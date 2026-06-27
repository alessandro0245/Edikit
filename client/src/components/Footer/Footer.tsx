'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function SimpleFooter() {

  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if(isDashboardRoute) return null;
  
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

        {/* Center: System Slogan / Context (Subtle text) */}
        <div className="hidden lg:block text-muted-foreground/60 font-normal truncate max-w-md">
          Bring your static designs to life with automated motion graphics templates.
        </div>

        {/* Right Side: Quick Action & Policy Navigation Anchors */}
        <div className="flex items-center gap-5 sm:gap-6 shrink-0">
          <Link href="/templates" className="hover:text-foreground transition-colors uppercase tracking-wider text-[10px]">
            Templates
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors uppercase tracking-wider text-[10px]">
            Pricing
          </Link>
          <div className="h-2.5 w-px bg-border/50 hidden sm:block" />
        
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors font-normal">
            Privacy Policy
          </Link>
        </div>

      </div>
    </footer>
  );
}