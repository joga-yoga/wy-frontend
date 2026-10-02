import Link from "next/link";

import { Button } from "@/components/ui/button";

export function BlogProblem({ missing = false }: { missing?: boolean }) {
  return (
    <main className="mx-auto max-w-3xl px-5 md:px-8 py-16">
      <h1 className="text-3xl font-semibold">
        {missing ? "Nie znaleziono artykułu" : "Nie udało się wczytać bloga"}
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        {missing ? "Artykuł pod tym adresem nie jest dostępny." : "Spróbuj ponownie za chwilę."}
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/blog">Wróć do bloga</Link>
      </Button>
    </main>
  );
}
