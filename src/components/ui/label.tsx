"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      size: {
        default: "text-sm font-medium",
        sm: "text-sm font-medium",
        event: "text-xl md:text-3xl font-semibold text-gray-800 flex",
        "event-description": "text-base md:text-xl font-normal text-gray-500 flex md:pt-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, size, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ size }), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
