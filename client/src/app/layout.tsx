import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Providers from "@/redux/Provider";
import Script from "next/script";
import SimpleFooter from "@/components/Footer/Footer";

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
      <body className={`antialiased dark min-h-screen flex flex-col`} suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <SimpleFooter/>
        </Providers>

        {/* iubenda Script */}
        <Script src="https://cdn.iubenda.com/iubenda.js" strategy="lazyOnload" />
        {/* <Script strategy="lazyOnload" src="https://www.iubenda.com/privacy-policy/40029799/cookie-policy" />
        <script type="text/javascript" src="https://embeds.iubenda.com/widgets/4150beb2-3cab-44a9-9fe6-fd5c93d6cbd6.js"></script> */}
         <script id="cookieyes" type="text/javascript" src="https://cdn-cookieyes.com/client_data/390ecbff1413870983f6e78b6331e66b/script.js"></script>
      </body>
    </html>
  );
}