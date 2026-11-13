import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import { renderToStaticMarkup } from "react-dom/server";

import { ArticleView } from "../../src/app/(public)/blog/article-view";
import { BlogIndex } from "../../src/app/(public)/blog/blog-index";
import { articleFixtureList, articleFixtures } from "../../src/app/(public)/blog/fixtures";
import {
  HIND_SILIGURI_FONT_FAMILY,
  HIND_SILIGURI_STYLESHEET_URL,
} from "../../src/lib/typography";

// A static component preview when a local Next server cannot be started. This does
// not replace production HTTP tests or inspection inside the shared public layout.
async function main() {
  const stylesheet = path.resolve("src/styles/globals.css");
  const css = await postcss([tailwindcss()]).process(await readFile(stylesheet, "utf8"), {
    from: stylesheet,
  });
  const output = "/tmp/joga-blog-preview";
  await mkdir(output, { recursive: true });
  const previews = [
    { name: "index", element: <BlogIndex items={articleFixtureList().items} /> },
    ...articleFixtures.map((article) => ({
      name: article.slug,
      element: <ArticleView article={article} />,
    })),
  ];
  for (const preview of previews) {
    await writeFile(
      path.join(output, `${preview.name}.html`),
      `<!doctype html><html lang="pl" style='--font-hind-siliguri:${HIND_SILIGURI_FONT_FAMILY}'><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${HIND_SILIGURI_STYLESHEET_URL.replaceAll("&", "&amp;")}"><style>${css.css}</style></head><body>${renderToStaticMarkup(preview.element)}</body></html>`,
    );
  }
  console.log(`Static blog component previews: ${output} (Hind Siliguri, no shared layout)`);
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
