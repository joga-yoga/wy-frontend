// components/link.tsx

"use client";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { useNavigationBlocker } from "./navigation-block";

/**
 * A custom Link component that wraps Next.js's next/link component.
 */
export function LinkWithBlocker({
  href,
  children,
  replace,
  ...rest
}: Parameters<typeof NextLink>[0]) {
  const router = useRouter();
  const { isBlocked, openModal } = useNavigationBlocker();

  const navigate = () => {
    startTransition(() => {
      const url = href.toString();
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    });
  };

  return (
    <NextLink
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (isBlocked) {
          openModal(navigate);
        } else {
          navigate();
        }
      }}
      {...rest}
    >
      {children}
    </NextLink>
  );
}
