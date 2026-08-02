'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const SESSION_KEY = 'edikit-preloader-shown';

export default function IubendaCookieBanner() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // If preloader was already shown in this session, load Iubenda immediately
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        setShouldLoad(true);
        return;
      }
    } catch {
      /* fallback */
    }

    // Delay loading Iubenda scripts until preloader has completed (4.5s minDisplay + 0.7s fade = 5.2s)
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 5200);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) return null;

  return (
    <>
      <Script
        src="https://embeds.iubenda.com/widgets/97df219b-28e7-4dab-aced-9888cfb87cda.js"
        strategy="afterInteractive"
      />
      <Script id="iubenda-cons-init" strategy="afterInteractive">
        {`var _iub = _iub || {}; _iub.cons_instructions = _iub.cons_instructions || []; _iub.cons_instructions.push(["init", {api_key: "Ki9lMDUKaWtobf92UIKJbCdOZTIDFFFi"}]);`}
      </Script>
      <Script
        src="https://cdn.iubenda.com/cons/iubenda_cons.js"
        strategy="afterInteractive"
      />
    </>
  );
}
