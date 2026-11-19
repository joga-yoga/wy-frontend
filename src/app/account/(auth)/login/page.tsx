import { Metadata } from "next";
import { Suspense } from "react";

import { LoginPage } from "./login";

export const metadata: Metadata = {
  title: "Logowanie | joga.yoga",
};

export default function LoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
