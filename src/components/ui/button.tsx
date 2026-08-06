import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-[1.5px] bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        muted: "text-base bg-muted text-foreground hover:bg-muted/70",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "text-white bg-gray-700 hover:bg-gray-800",
        green: "text-white bg-brand-green-700 hover:bg-brand-green-700/90 disabled:bg-gray-500",
        // The B2B panel's muted destructive fill (e.g. "Odwołaj sesję"). Distinct from
        // `destructive`, which is the louder system red — don't repurpose that one.
        danger:
          "text-white bg-b2b-red-solid hover:bg-b2b-red-solid/90 disabled:bg-gray-500 focus-visible:ring-b2b-red-solid/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        cta: "h-[48px] md:h-[48px] rounded-full text-lg md:text-xl px-4",
        /**
         * The B2B panel's action size, from the design HTML: `.btn-primary` is
         * `border-radius:999px; padding:16px; font-size:16.5px; font-weight:700`, and
         * `.footbar .fb` the same pill one step down.
         *
         * `cta` is the *public* pages' larger single call to action (Zarezerwuj) and
         * keeps its bigger type; this is its panel-scale sibling. Both are pills —
         * the default `rounded-md h-9` is what made every save button in the panel look
         * unlike the design.
         */
        action: "h-12 rounded-full px-5 text-base font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
