import "@/styles/globals.css";

import type { Metadata } from "next";
import { Viewport } from "next";

import Layout from "@/components/layout/Layout";

import { fonts } from "./fonts";
import { Providers } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "W.Y",
  description: "W.Y",
  openGraph: {
    description: "W.Y",
  },
  robots: "all",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${fonts.hindSiliguri.className} ${fonts.hindSiliguri.variable}`}
    >
      <head>
        <meta name="googlebot" content="all" />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
