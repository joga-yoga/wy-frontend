import "@/styles/globals.css";

import type { Metadata } from "next";
import { Viewport } from "next";

import { fonts } from "./fonts";
import { Providers } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Yoga events and retreats",
    template: "%s",
  },
  description: "Public calendar for yoga retreats, workshops, classes, and partner profiles.",
  openGraph: {
    title: "Yoga events and retreats",
    description: "Public calendar for yoga retreats, workshops, classes, and partner profiles.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning={true}
      className={`${fonts.hindSiliguri.className} ${fonts.hindSiliguri.variable}`}
    >
      <head>
        <meta name="googlebot" content="all" />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
