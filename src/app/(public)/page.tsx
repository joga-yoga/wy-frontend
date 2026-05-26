// /workshops serves the canonical URL for workshops (/).
// Re-exporting here gives Next.js a real page file at "/" so RSC payloads
// are generated for this path — without this, rewrites alone cause RSC 404s
// during client-side navigation.
export { default, metadata } from "./workshops/page";
