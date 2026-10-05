import Link from "next/link";

import { Button } from "@/components/ui/button";

import { blogProblemCopy } from "./problem-copy";

export function BlogProblem({ missing = false }: { missing?: boolean }) {
  const { title, description } = blogProblemCopy[missing ? "missing" : "unavailable"];
  return (
    <main className="mx-auto max-w-3xl px-5 md:px-8 py-16">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-4 text-lg text-gray-600">{description}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/blog">Wróć do bloga</Link>
      </Button>
    </main>
  );
}
