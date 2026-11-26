export const BLOG_PAGE_SIZE = 12;
const MAX_PAGE = Math.floor(2_147_483_647 / BLOG_PAGE_SIZE) + 1;

export function parseBlogPage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= MAX_PAGE ? page : null;
}

export function normalizeBlogPage(params: URLSearchParams): "invalid" | "unchanged" | "normalized" {
  const values = params.getAll("page");
  const page = parseBlogPage(values.length > 1 ? values : values[0]);
  if (page === null) return "invalid";
  if (!values.length || (page > 1 && values[0] === String(page))) return "unchanged";

  if (page === 1) params.delete("page");
  else params.set("page", String(page));
  return "normalized";
}

export function blogIndexPath(page = 1): string {
  return page === 1 ? "/blog" : `/blog?page=${page}`;
}

export function blogPageNumbers(page: number, totalPages: number): number[] {
  return [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
}
