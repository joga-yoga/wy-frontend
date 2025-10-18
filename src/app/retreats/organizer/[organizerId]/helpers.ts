export function truncateText(str: string, maxLength: number) {
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
}
