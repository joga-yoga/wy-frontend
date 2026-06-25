import type { Metadata } from "next";

import { CreateProfileFlow } from "@/components/create-profile/CreateProfileFlow";

export const metadata: Metadata = {
  title: "Stwórz profil nauczyciela jogi | joga.yoga",
  description: "Wygeneruj wstępny profil nauczyciela jogi na joga.yoga.",
};

export default function CreatePage() {
  return <CreateProfileFlow />;
}
