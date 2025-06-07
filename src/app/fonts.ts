// app/fonts.ts
import { Hind_Siliguri, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["latin"],
  variable: "--font-hind-siliguri",
  weight: ["300", "400", "500", "600", "700"],
});

export const fonts = {
  inter,
  hindSiliguri,
};
