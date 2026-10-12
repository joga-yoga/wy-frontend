import { NextResponse } from "next/server";

import { blogProblemCopy } from "./problem-copy";

// A rewrite into an App Router page can start streaming under HTTP 200. Return
// the complete document here so the status is final before any body is sent.
// HTML also makes the client router fall back to a normal document navigation.
export function blogProblemResponse(
  status: 404 | 503,
  blogHome: "/" | "/blog" = "/blog",
): NextResponse {
  const { title, description } = blogProblemCopy[status === 404 ? "missing" : "unavailable"];
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>${title} | joga.yoga</title>
  <style>
    body { margin: 0; color: #1f2937; background: #fff; font-family: system-ui, sans-serif; }
    main { max-width: 48rem; margin: 0 auto; padding: 4rem 1.5rem; }
    h1 { font-size: 1.875rem; line-height: 1.2; font-weight: 600; }
    p { font-size: 1.125rem; line-height: 1.6; color: #4b5563; }
    a { display: inline-block; margin-top: 1.5rem; padding: .75rem 1rem;
        border: 1px solid #d1d5db; border-radius: .375rem; color: inherit; text-decoration: none; }
    a:hover { background: #f3f4f6; }
    a:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  </style>
</head>
<body><main><h1>${title}</h1><p>${description}</p><a href="${blogHome}">Wróć do bloga</a></main></body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        ...(status === 503 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}
