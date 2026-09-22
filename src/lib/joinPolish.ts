/** "A", "A i B", "A, B i C" — Polish takes **i** before the last item and no serial comma. */
export function joinPolish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} i ${items[items.length - 1]}`;
}
