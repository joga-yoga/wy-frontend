"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";
import { IoLogoFacebook, IoLogoInstagram } from "react-icons/io5";

import { cn } from "@/lib/utils";

import LogoTransparentSmall from "../icons/LogoTransparentSmall";
import { Separator } from "../ui/separator";

const RETREATS_FOOTER_SECTIONS: {
  title: string;
  links: { label: string; href: string; isExternal?: boolean }[];
  description: React.ReactNode;
}[] = [
  {
    title: "Pomoc",
    links: [
      { label: "FAQ dla organizatorów", href: "/faq/organizers" },
      { label: "FAQ dla podróżujących", href: "/faq/travelers" },
    ],
    description: (
      <p className="text-m-sunscript-font text-gray-500">{`© ${new Date().getFullYear()} All Rights Reserved`}</p>
    ),
  },
  {
    title: "News",
    links: [
      { label: "Wyjazdy jogowe 2025", href: "#" },
      { label: "Najlepsze wyjazdy jogowe", href: "#" },
    ],
    description: (
      <Link href="/policy" className="text-m-sunscript-font text-gray-500 hover:underline">
        Polityka prywatności
      </Link>
    ),
  },
  {
    title: "Opinia",
    links: [
      { label: "Doskonałe miejsce na odpoczynek", href: "#" },
      { label: "Joga w Polsce 2025", href: "#" },
    ],
    description: (
      <Link href="/terms" className="text-m-sunscript-font text-gray-500 hover:underline">
        Regulamin
      </Link>
    ),
  },

  {
    title: "O nas",
    links: [
      { label: "Blog", href: "https://wiedza.joga.yoga", isExternal: true },
      { label: "Kontakt", href: "/contact" },
    ],
    description: (
      <div className="flex gap-2">
        <Link
          href="https://www.facebook.com/groups/wyjazdyjogowe"
          className="text-gray-800 hover:text-gray-600 duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IoLogoFacebook className="w-6 h-6" />
        </Link>
        <Link
          href="https://www.instagram.com/wyjazdy.yoga/"
          className="text-gray-800 hover:text-gray-600 duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IoLogoInstagram className="w-6 h-6" />
        </Link>
      </div>
    ),
  },
];

const WORKSHOPS_FOOTER_SECTIONS: {
  title: string;
  links: { label: string; href: string; isExternal?: boolean }[];
  description: React.ReactNode;
}[] = [
  {
    title: "Pomoc",
    links: [
      { label: "FAQ dla organizatorów", href: "/faq/organizers" },
      { label: "FAQ dla uczestników", href: "/faq/travelers" },
    ],
    description: (
      <p className="text-m-sunscript-font text-gray-500">{`© ${new Date().getFullYear()} All Rights Reserved`}</p>
    ),
  },
  {
    title: "News",
    links: [
      { label: "Wydarzenia jogowe 2025", href: "#" },
      { label: "Najlepsze wydarzenia jogowe", href: "#" },
    ],
    description: (
      <Link href="/policy" className="text-m-sunscript-font text-gray-500 hover:underline">
        Polityka prywatności
      </Link>
    ),
  },
  {
    title: "Opinia",
    links: [
      { label: "Doskonałe miejsce na odpoczynek", href: "#" },
      { label: "Joga w Polsce 2025", href: "#" },
    ],
    description: (
      <Link href="/terms" className="text-m-sunscript-font text-gray-500 hover:underline">
        Regulamin
      </Link>
    ),
  },

  {
    title: "O nas",
    links: [
      { label: "Blog", href: "https://wiedza.joga.yoga", isExternal: true },
      { label: "Kontakt", href: "/contact" },
    ],
    description: (
      <div className="flex gap-2">
        <Link
          href="https://www.facebook.com/groups/wyjazdyjogowe"
          className="text-gray-800 hover:text-gray-600 duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IoLogoFacebook className="w-6 h-6" />
        </Link>
        <Link
          href="https://www.instagram.com/wyjazdy.yoga/"
          className="text-gray-800 hover:text-gray-600 duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IoLogoInstagram className="w-6 h-6" />
        </Link>
      </div>
    ),
  },
];

const FooterSection = ({
  title,
  links,
  className,
}: {
  title: string;
  links: { label: string; href: string; isExternal?: boolean }[];
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      <h3 className="text-footer-links font-bold text-gray-600">{title}</h3>
      <ul className="flex flex-col gap-4">
        {links.map((link) => (
          <li className="text-footer-links text-gray-600 hover:underline" key={link.label}>
            <Link
              href={link.href}
              target={link.isExternal ? "_blank" : undefined}
              rel={link.isExternal ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const LogoFooter = ({
  className,
  project,
}: {
  className?: string;
  project: "retreats" | "workshops";
}) => {
  return (
    <div className={cn("flex flex-col items-center gap-2 md:gap-3", className)}>
      <div
        className={cn(
          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-[1px_1px_16px_10px_rgba(255,252,238,0.5)] text-xl md:text-h-middle bg-gray-600",
        )}
      >
        <LogoTransparentSmall className={`w-10 h-10 md:w-12 md:h-12 text-white`} />
      </div>
      <p className={`flex items-center text-xl font-semibold text-gray-600`}>
        {project === "retreats" ? "wyjazdy" : "wydarzenia"}
        <span
          className={cn(
            "inline-block rounded-md leading-[100%] pl-[2px] pt-[2px] pb-[4px] pr-[6px] bg-gray-600 text-white",
          )}
        >
          .yoga
        </span>
      </p>
    </div>
  );
};

export const Footer: React.FC<{ project: "retreats" | "workshops" }> = ({ project }) => {
  const pathname = usePathname();
  const params = useParams();
  const isEventPage = !!params.slug;
  const FOOTER_SECTIONS =
    project === "retreats" ? RETREATS_FOOTER_SECTIONS : WORKSHOPS_FOOTER_SECTIONS;
  return (
    <>
      <footer className="w-full bg-gray-100">
        <div
          className={cn(
            "container-wy mx-auto px-5 md:px-8 pt-10 pb-[100px] md:pb-10",
            isEventPage && "pb-[160px] md:pb-[160px]",
          )}
        >
          <div className="flex justify-center w-full mb-8 md:mb-10">
            <LogoFooter project={project} />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-0">
            {FOOTER_SECTIONS.map((section, index) => (
              <FooterSection
                key={section.title}
                title={section.title}
                links={section.links}
                className={cn(
                  "w-full",
                  index === FOOTER_SECTIONS.length - 1 && "w-max min-w-[80px]",
                )}
              />
            ))}
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            {FOOTER_SECTIONS.map((section, index) =>
              section.description ? (
                <div
                  key={section.title}
                  className={cn(
                    "w-full",
                    index === FOOTER_SECTIONS.length - 1 && "w-max min-w-[80px]",
                  )}
                >
                  {section.description}
                </div>
              ) : null,
            )}
          </div>
        </div>
      </footer>
    </>
  );
};
