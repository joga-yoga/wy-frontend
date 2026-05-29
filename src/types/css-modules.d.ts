// Silences VSCode false-positive for CSS-only subpath exports (e.g. "swiper/css/navigation").
// TypeScript's language server can't resolve bare .css files from package exports maps,
// but webpack/Next.js handles them correctly at build time.
declare module "swiper/css";
declare module "swiper/css/*";
