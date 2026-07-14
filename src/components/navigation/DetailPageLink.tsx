"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { writeNavigationOrigin } from "@/lib/navigation-origin";

type DetailPageLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & {
  href: string;
};

export function DetailPageLink({ href, ...props }: DetailPageLinkProps) {
  const recordOrigin = () => {
    const target = new URL(href, window.location.origin).pathname;
    writeNavigationOrigin(target, window.location.pathname);
  };

  return <Link {...props} href={href} onNavigate={recordOrigin} />;
}
