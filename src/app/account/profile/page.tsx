"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { ProfileForm } from "@/app/account/components/ProfileForm";

export default function AccountProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4">
        <button
          onClick={() => router.back()}
          aria-label="Wróć"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="truncate text-xl font-bold text-gray-900">Dane konta</h1>
      </header>
      <ProfileForm />
    </div>
  );
}
