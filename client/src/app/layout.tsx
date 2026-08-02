import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Providers from "@/redux/Provider";
import SimpleFooter from "@/components/Footer/Footer";
import IubendaCookieBanner from "@/components/PreLoaderScreen/IubendaCookieBanner";

export const metadata: Metadata = {
  title: "Edikit | Create Production-Level Motion Graphics in Seconds",
  description:
    "Edikit lets you create viral, production-level motion graphics in seconds. Choose a template, customize it, and generate videos automatically.",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml", sizes: "any" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Step 1 — establish connections early */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link rel="preconnect" href="https://edikit-api-mc9p.onrender.com" />
        {/* Step 2 — tell browser to fetch font file early */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
        />

        {/* Step 3 — load font without blocking render */}
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
          media="print"
          // @ts-expect-error - onLoad with string value is valid HTML but TS complains
          onLoad="this.media='all'"
        />

        {/* Step 4 — fallback for users with JavaScript disabled */}
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
            rel="stylesheet"
          />
        </noscript>

        {/* Step 5 — preload logo so it's ready before browser finds the img tag */}
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
      </head>

      <body
        className="antialiased dark min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <IubendaCookieBanner />
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <SimpleFooter />
        </Providers>
      </body>
    </html>
  );
}