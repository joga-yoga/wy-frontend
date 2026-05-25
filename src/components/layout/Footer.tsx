"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { IoLogoFacebook, IoLogoInstagram } from "react-icons/io5";

import { COOKIE_SETTINGS_OPEN_EVENT } from "@/lib/cookieConsent";
import { cn } from "@/lib/utils";

import { Separator } from "../ui/separator";

const COPYRIGHT_YEAR = 2026;

type FooterSectionDef = {
  title: string;
  links: { label: string; href: string; isExternal?: boolean }[];
};

function buildFooterSections(
  prefix: string,
  project: "retreats" | "workshops",
): FooterSectionDef[] {
  return [
    {
      title: "Pomoc",
      links: [
        { label: "FAQ dla organizatorów", href: `${prefix}/faq/organizers` },
        {
          label: project === "retreats" ? "FAQ dla podróżujących" : "FAQ dla uczestników",
          href: `${prefix}/faq/travelers`,
        },
      ],
    },
    {
      title: "O nas",
      links: [{ label: "Kontakt", href: `${prefix}/contact` }],
    },
  ];
}

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
    <div className={cn("flex flex-col gap-4", className)}>
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
      {/* <div
        className={cn(
          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-[1px_1px_16px_10px_rgba(255,252,238,0.5)] text-xl md:text-h-middle bg-gray-600",
        )}
      >
        <LogoTransparentSmall className={`w-10 h-10 md:w-12 md:h-12 text-white`} />
      </div> */}
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

const FooterBottom = ({
  onOpenCookieSettings,
  project,
  sectionPrefix,
}: {
  onOpenCookieSettings: () => void;
  project: "retreats" | "workshops";
  sectionPrefix: string;
}) => {
  return (
    <>
      <div className="flex w-full md:justify-start mb-6 md:mb-6">
        <LogoFooter project={project} />
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-m-sunscript-font text-gray-500 order-2 md:order-1">
          <span className="w-full md:w-auto">{`© ${COPYRIGHT_YEAR} All Rights Reserved`}</span>
          <span aria-hidden="true" className="hidden md:block">
            ·
          </span>
          <Link href={`${sectionPrefix}/policy`} className="hover:underline">
            Prywatność
          </Link>
          <span aria-hidden="true">·</span>
          <Link href={`${sectionPrefix}/terms`} className="hover:underline">
            Warunki
          </Link>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            className="hover:text-gray-700 hover:underline"
            onClick={onOpenCookieSettings}
          >
            Ustawienia plików cookie
          </button>
        </div>
        <div className="flex items-center gap-5 order-1 md:order-2">
          <Link
            href="https://www.facebook.com/groups/wyjazdyjogowe"
            className="text-gray-800 duration-200 hover:text-gray-600"
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label="Facebook"
          >
            <IoLogoFacebook className="h-6 w-6" />
          </Link>
          <Link
            href="https://www.instagram.com/wyjazdy.yoga/"
            className="text-gray-800 duration-200 hover:text-gray-600"
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label="Instagram"
          >
            <IoLogoInstagram className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </>
  );
};

export const Footer: React.FC<{ project: "retreats" | "workshops" }> = ({ project }) => {
  const params = useParams();
  const isEventPage = !!params.slug;
  const sectionPrefix = project === "retreats" ? "/wyjazdy" : "/wydarzenia";
  const FOOTER_SECTIONS = buildFooterSections(sectionPrefix, project);

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_OPEN_EVENT));
  };

  return (
    <>
      <footer className="w-full bg-gray-100">
        <div
          className={cn(
            "container-wy mx-auto px-5 md:px-8 pt-10 pb-[100px] md:pb-10",
            isEventPage && "pb-[160px] md:pb-[160px]",
          )}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-start gap-10 md:gap-20">
            {FOOTER_SECTIONS.map((section, index) => (
              <FooterSection key={section.title} title={section.title} links={section.links} />
            ))}
          </div>
          <Separator className="my-6" />
          <FooterBottom
            onOpenCookieSettings={handleOpenCookieSettings}
            project={project}
            sectionPrefix={sectionPrefix}
          />
        </div>
      </footer>
    </>
  );
};
