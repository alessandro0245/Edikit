import localFont from "next/font/local";

export const sans = localFont({
  src: "./GoogleSansFlex-latin.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-sans-latin",
});

export const sansExt = localFont({
  src: "./GoogleSansFlex-latin-ext.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-sans-ext",
  preload: false,
});
