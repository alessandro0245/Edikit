import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Providers from "@/redux/Provider";
import SimpleFooter from "@/components/Footer/Footer";
import Script from "next/script";
import { sans, sansExt } from "@/fonts";
import { cn } from "@/lib/utils";

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
    <html lang="en" className={cn(sans.variable, sansExt.variable)}>
      <head>
        <link rel="preconnect" href="https://edikit-api-mc9p.onrender.com" />
        {/* Preload logo so it's ready before browser finds the img tag */}
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
      </head>

      <body
        className="antialiased dark min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        {/* Iubenda — afterInteractive is correct, loads after page is ready */}
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