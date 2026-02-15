import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Providers from "@/redux/Provider";
import { Google_Sans_Flex } from "next/font/google";

// Google Sans Flex Variable Font
// const googleSansFlex = localFont({
//   src: [
//     {
//       path: "../../public/fonts/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.woff2",
//       weight: "100 900", // Variable font supports full weight range
//       style: "normal",
//     },
//     {
//       path: "../../public/fonts/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.woff",
//       weight: "100 900", // Variable font supports full weight range
//       style: "normal",
//     }
//   ],
//   variable: "--font-google-sans-flex",
//   display: "swap",
// });

export const metadata: Metadata = {
  title: "Edikit : Create Production-Level Motion Graphics in Seconds",
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
        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        ></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className={` antialiased dark`} suppressHydrationWarning>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
