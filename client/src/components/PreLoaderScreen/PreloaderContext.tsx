'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = 'IDLE' | 'ACTIVE' | 'FADING' | 'DONE';

interface PreloaderContextValue {
  /** `true` only after the preloader has fully faded out and unmounted. */
  heroReady: boolean;
  /** `true` only after the preloader exit is complete — mount Iubenda here. */
  cookieBannerReady: boolean;
  /** Current phase of the preloader state machine. */
  phase: Phase;
  /** Called by PreloaderGate when EdikitPreloader's fade-out transition ends. */
  onPreloaderExitComplete: () => void;
}

const PreloaderContext = createContext<PreloaderContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePreloader(): PreloaderContextValue {
  const ctx = useContext(PreloaderContext);
  if (!ctx) {
    throw new Error('usePreloader must be used within a <PreloaderProvider>');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const SESSION_KEY = 'edikit-preloader-shown';
const MIN_DISPLAY_MS = 4500;
/** CSS transition-duration on EdikitPreloader's fade-out (700ms) + buffer */
const FADE_FALLBACK_MS = 1000;

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('IDLE');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedOverflowRef = useRef<string>('');
  const finalizedRef = useRef(false);

  /* ── Lock / unlock body scroll ─────────────────────────────────── */

  const lockScroll = useCallback(() => {
    savedOverflowRef.current =
      document.documentElement.style.overflow || '';
    document.documentElement.style.overflow = 'hidden';
  }, []);

  const unlockScroll = useCallback(() => {
    document.documentElement.style.overflow = savedOverflowRef.current;
  }, []);

  /* ── Transition to DONE (shared exit logic — idempotent) ───────── */

  const finalize = useCallback(() => {
    if (finalizedRef.current) return; // prevent double-fire
    finalizedRef.current = true;

    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    setPhase('DONE');
    unlockScroll();
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* private browsing — swallow */
    }
  }, [unlockScroll]);

  /* ── Preloader exit-complete callback (called by PreloaderGate) ── */

  const onPreloaderExitComplete = useCallback(() => {
    finalize();
  }, [finalize]);

  /* ── First interaction handler ─────────────────────────────────── */

  useEffect(() => {
    // Skip if already shown this session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        finalizedRef.current = true;
        setPhase('DONE');
        return;
      }
    } catch {
      /* private browsing — continue normally */
    }

    const controller = new AbortController();
    const { signal } = controller;

    const handleFirstInteraction = () => {
      // Abort all listeners at once
      controller.abort();

      // Transition to ACTIVE — show preloader, lock scroll
      lockScroll();
      setPhase('ACTIVE');

      // After minimum display time, transition to FADING
      timerRef.current = setTimeout(() => {
        setPhase('FADING');

        // Safety fallback: if CSS transitionEnd never fires, force DONE
        fallbackRef.current = setTimeout(() => {
          finalize();
        }, FADE_FALLBACK_MS);
      }, MIN_DISPLAY_MS);
    };

    const opts: AddEventListenerOptions = { once: true, passive: true, signal };

    window.addEventListener('click', handleFirstInteraction, opts);
    window.addEventListener('keydown', handleFirstInteraction, opts);
    window.addEventListener('touchstart', handleFirstInteraction, opts);
    window.addEventListener('scroll', handleFirstInteraction, opts);

    return () => {
      controller.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
  }, [lockScroll, finalize]);

  /* ── Context value ─────────────────────────────────────────────── */

  const value: PreloaderContextValue = {
    heroReady: phase === 'DONE',
    cookieBannerReady: phase === 'DONE',
    phase,
    onPreloaderExitComplete,
  };

  return (
    <PreloaderContext.Provider value={value}>
      {children}
    </PreloaderContext.Provider>
  );
}

export default PreloaderContext;
