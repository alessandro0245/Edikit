'use client';

import { useEffect, useState } from 'react';
import MagicRings from './MagicRings';
import ShinyText from './ShinnyText';

export interface EdikitPreloaderProps {
  /** Minimum time to show the preloader. Default 4500ms */
  minDisplayMs?: number;
  /** Fires after the fade-out transition finishes */
  onExitComplete?: () => void;
}

const SESSION_KEY = 'edikit-preloader-shown';

export default function EdikitPreloader({
  minDisplayMs = 4500,
  onExitComplete,
}: EdikitPreloaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        document.documentElement.classList.add('preloader-done');
        setVisible(false);
        onExitComplete?.();
        return;
      }
    } catch {
      /* private browsing fallback */
    }

    // Step 1: Hold preloader for minDisplayMs
    const displayTimer = setTimeout(() => {
      setFading(true);

      // Step 2: Fade for 700ms (matches CSS transition duration), then unmount
      const fadeTimer = setTimeout(() => {
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
          document.documentElement.classList.add('preloader-done');
        } catch {
          /* fallback */
        }
        setVisible(false);
        onExitComplete?.();
      }, 700);

      return () => clearTimeout(fadeTimer);
    }, minDisplayMs);

    return () => clearTimeout(displayTimer);
  }, [minDisplayMs, onExitComplete]);

  // Lock scrollbar while preloader is visible
  useEffect(() => {
    if (!visible) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `if(typeof window!=='undefined'&&sessionStorage.getItem('${SESSION_KEY}')){document.documentElement.classList.add('preloader-done');}`,
        }}
      />
      <div
        className={`fixed inset-0 z-[100] flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#090909] transition-opacity duration-700 ease-out [.preloader-done_&]:hidden ${
          fading ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden={fading}
      >
        {/* Ring background — Edikit brand blue gradient */}
        <MagicRings
          color="#1E78F2"
          colorTwo="#5BB0FA"
          ringCount={6}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.3}
          radiusStep={0.09}
          scaleRate={0.1}
          speed={1}
          opacity={0.9}
          rotation={0}
        />

        {/* Centered wordmark + tagline */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <ShinyText
            text="Edikit"
            speed={2.2}
            color="#6B7280"
            shineColor="#F7F7F7"
            spread={120}
            className="text-5xl font-bold tracking-tight md:text-6xl"
          />
        </div>
      </div>
    </>
  );
}