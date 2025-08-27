"use client";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import React from "react";
import { IoLogoFacebook, IoLogoInstagram } from "react-icons/io5";

import { cn } from "@/lib/utils";

import { Separator } from "../ui/separator";

const FOOTER_SECTIONS: {
  title: string;
  links: { label: string; href: string }[];
  description: React.ReactNode;
}[] = [
  {
    title: "Pomoc",
    links: [
      { label: "FAQ dla organizatorów", href: "#" },
      { label: "FAQ dla podróżujących", href: "#" },
    ],
    description: <p className="text-m-sunscript-font text-gray-500">© 2025 All Rights Reserved</p>,
  },
  {
    title: "News",
    links: [
      { label: "Wyjazdy jogowe 2025", href: "#" },
      { label: "Najlepsze wyjazdy jogowe", href: "#" },
    ],
    description: (
      <Link href="#" className="text-m-sunscript-font text-gray-500 hover:underline">
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
      <Link href="#" className="text-m-sunscript-font text-gray-500 hover:underline">
        Regulamin
      </Link>
    ),
  },

  {
    title: "O nas",
    links: [
      { label: "Blog", href: "#" },
      { label: "Kontakt", href: "#" },
    ],
    description: (
      <div className="flex gap-2">
        <Link
          href="#"
          className="text-gray-800 hover:text-gray-600 duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IoLogoFacebook className="w-6 h-6" />
        </Link>
        <Link
          href="#"
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
}: {
  title: string;
  links: { label: string; href: string }[];
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-footer-links font-bold text-gray-600">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li className="text-footer-links text-gray-600 hover:underline" key={link.label}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const params = useParams();
  const isEventPage = pathname.includes("/events/") && !!params.eventId;

  return (
    <>
      <footer className="w-full bg-gray-100">
        <div
          className={cn(
            "container-wy mx-auto px-5 md:px-8 pt-10 pb-[100px] md:pb-10",
            isEventPage && "pb-[140px]",
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-0">
            {FOOTER_SECTIONS.map((section) => (
              <FooterSection key={section.title} title={section.title} links={section.links} />
            ))}
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            {FOOTER_SECTIONS.map((section) =>
              section.description ? (
                <div key={section.title} className="w-full">
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
