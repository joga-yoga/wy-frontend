"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { MenuIconTile } from "@/components/menu/MenuRow";
import {
  type BusinessMode,
  useBusinessModeConfirmation,
} from "@/components/partner/useBusinessModeConfirmation";

const directions = [
  {
    mode: "studio",
    title: "Utwórz studio",
    description: "Profil i zarządzanie studiem",
    image: "/images/logo/logo-studio.png",
    href: "/account/partner/studio/create",
  },
  {
    mode: "solo",
    title: "Solo Instruktor",
    description: "Własny grafik, klienci i płatności",
    image: "/images/logo/logo-solo-instructor.png",
    href: "/account/partner/solo-booking",
  },
] satisfies {
  mode: BusinessMode;
  title: string;
  description: string;
  image: string;
  href: string;
}[];

export function BusinessDirectionCards() {
  const router = useRouter();
  const { confirmMode, dialog } = useBusinessModeConfirmation();

  return (
    <>
      <div className="grid grid-cols-2 items-stretch gap-4">
        {directions.map((direction) => (
          <button
            key={direction.mode}
            type="button"
            onClick={async (event) => {
              if (await confirmMode(direction.mode, event.currentTarget))
                router.push(direction.href);
            }}
            className="flex min-h-[148px] min-w-0 flex-col items-start rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(28,25,23,0.06),0_1px_1px_rgba(28,25,23,0.04)] transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-b2b-green-strong"
          >
            <MenuIconTile>
              <Image
                src={direction.image}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </MenuIconTile>
            <span className="mt-3 text-base leading-6 font-semibold text-zinc-800">
              {direction.title}
            </span>
            <span className="mt-1 text-sm leading-[21px] text-zinc-500">
              {direction.description}
            </span>
          </button>
        ))}
      </div>
      {dialog}
    </>
  );
}
