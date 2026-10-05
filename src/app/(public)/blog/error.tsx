"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Also covers a failure between the proxy's status check and the page's fresh read.
export default function BlogError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 md:px-8 py-16">
      <h1 className="text-3xl font-semibold">Nie udało się wczytać bloga</h1>
      <p className="mt-4 text-lg text-gray-600">Spróbuj ponownie za chwilę.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset}>Spróbuj ponownie</Button>
        <Button asChild variant="outline">
          <Link href="/blog">Wróć do bloga</Link>
        </Button>
      </div>
    </main>
  );
}
