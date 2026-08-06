import { Metadata } from "next";
import { Suspense } from "react";

import { LoginPage } from "./login";

export const metadata: Metadata = {
  title: "W.Y",
};

export default function LoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
