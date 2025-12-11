import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.joga.yoga"),
  title: "Joga.Yoga App",
  description: "Joga.Yoga Application",
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
