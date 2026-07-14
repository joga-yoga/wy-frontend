import type { Variants } from "motion/react";

export const gridContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const gridTileVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: "easeOut" } },
};
