import { Fragment, type ReactNode } from "react";

// The public contract supplies plain text with Markdown paragraphs, lists, inline
// emphasis and links. Render that subset as React elements; never interpret raw HTML.
export function safeArticleHref(value: string): string | undefined {
  const href = value.trim();
  if (/^\/(?!\/)/.test(href) || /^#[^\s]*$/.test(href)) return href;
  try {
    const url = new URL(href);
    if (["https:", "http:", "mailto:"].includes(url.protocol)) return href;
  } catch {
    return undefined;
  }
  return undefined;
}

function inlineText(text: string): ReactNode[] {
  const pattern =
    /\\([\\`*_{}\[\]()#+.!>~-])|`([^`\n]+)`|\[([^\]]+)\]\(([^\s()]*(?:\([^\s()]*\)[^\s()]*)*)(?:\s+"[^"]*")?\)|<(https?:\/\/[^>]+)>|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([^*\n]+)\*|_([^_\n]+)_|~~([^~\n]+)~~/g;
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > offset) nodes.push(text.slice(offset, index));
    const [
      ,
      escaped,
      code,
      label,
      destination,
      autolink,
      strong,
      underscoreStrong,
      emphasis,
      underscoreEmphasis,
      strike,
    ] = match;
    let node: ReactNode;
    if (escaped) node = escaped;
    else if (code)
      node = <code className="rounded bg-gray-100 px-1 py-0.5 text-[0.9em]">{code}</code>;
    else if (label || autolink) {
      const href = safeArticleHref(destination ?? autolink);
      const children = label ? inlineText(label) : autolink;
      node = href ? (
        <a href={href} className="underline underline-offset-4 hover:text-gray-600 break-words">
          {children}
        </a>
      ) : (
        children
      );
    } else if (strong || underscoreStrong)
      node = <strong>{inlineText(strong ?? underscoreStrong)}</strong>;
    else if (emphasis || underscoreEmphasis)
      node = <em>{inlineText(emphasis ?? underscoreEmphasis)}</em>;
    else node = <del>{inlineText(strike)}</del>;
    nodes.push(<Fragment key={index}>{node}</Fragment>);
    offset = index + match[0].length;
  }
  if (offset < text.length) nodes.push(text.slice(offset));
  return nodes;
}

const listLine = /^(\s*)([-+*]|\d+[.)])\s+(.+)$/;
const startsBlock = (line: string) =>
  /^(?:\s*$|\s*(?:[-+*]|\d+[.)])\s+|#{1,6}\s+|>\s?|```)/.test(line);

export function ArticleText({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const start = index;
    const line = lines[index];
    if (!line.trim()) {
      index++;
      continue;
    }
    if (line.startsWith("```")) {
      const code: string[] = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      index++;
      blocks.push(
        <pre key={start} className="overflow-x-auto rounded-xl bg-gray-100 p-4 text-sm">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      // H1 belongs to the article, H2 to its supplied section titles. Body headings
      // start at H3 even if source text contains an H1 or H2.
      const Tag = `h${Math.max(3, Math.min(6, heading[1].length))}` as "h3" | "h4" | "h5" | "h6";
      blocks.push(
        <Tag key={start} className="text-xl font-semibold pt-3">
          {inlineText(heading[2])}
        </Tag>,
      );
      index++;
      continue;
    }
    const item = listLine.exec(line);
    if (item) {
      const ordered = /^\d/.test(item[2]);
      const indent = item[1].length;
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const next = listLine.exec(lines[index]);
        if (!next || next[1].length !== indent || /^\d/.test(next[2]) !== ordered) break;
        const body = [next[3]];
        index++;
        while (
          index < lines.length &&
          lines[index].trim() &&
          /^\s+/.test(lines[index]) &&
          (listLine.exec(lines[index])?.[1].length ?? Infinity) > indent
        ) {
          body.push(lines[index].slice(indent + 2));
          index++;
        }
        items.push(
          <li key={index} className="pl-1">
            <ArticleText text={body.join("\n")} />
          </li>,
        );
      }
      blocks.push(
        ordered ? (
          <ol key={start} start={parseInt(item[2], 10)} className="list-decimal pl-6 space-y-2">
            {items}
          </ol>
        ) : (
          <ul key={start} className="list-disc pl-6 space-y-2">
            {items}
          </ul>
        ),
      );
      continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith(">"))
        quote.push(lines[index++].replace(/^>\s?/, ""));
      blocks.push(
        <blockquote key={start} className="border-l-2 border-gray-300 pl-5 text-gray-600">
          <ArticleText text={quote.join("\n")} />
        </blockquote>,
      );
      continue;
    }
    const paragraph = [line];
    index++;
    while (index < lines.length && !startsBlock(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={start}>{inlineText(paragraph.join("\n"))}</p>);
  }
  return <div className="space-y-4 break-words">{blocks}</div>;
}
