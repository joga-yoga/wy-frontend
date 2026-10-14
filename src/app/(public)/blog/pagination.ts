import { blogNavigationPath } from "./mirror";

export const BLOG_PAGE_SIZE = 12;
const MAX_PAGE = Math.floor(2_147_483_647 / BLOG_PAGE_SIZE) + 1;

export function parseBlogPage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= MAX_PAGE ? page : null;
}

export function blogIndexPath(page = 1, mirror = false): string {
  const base = blogNavigationPath(undefined, mirror);
  return page === 1 ? base : `${base}?page=${page}`;
}

export function blogPageNumbers(page: number, totalPages: number): number[] {
  return [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
}
