"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { IoChevronBack } from "react-icons/io5";

import { LinkWithBlocker } from "@/app/profile/(dashboard)/components/EventForm/block-navigation/link";
import { useNavigationBlocker } from "@/app/profile/(dashboard)/components/EventForm/block-navigation/navigation-block";
import { getOfertaCreatePath } from "@/app/profile/(dashboard)/oferta/ofertaConfig";
import { LogoFooter } from "@/components/layout/Footer";
import { FEATURE_FLAGS, useFeatureFlag } from "@/lib/featureFlags";

const MAIN_TAB_PATHS = ["/profile", "/profile/oferta", "/profile/konto"];

const TAB_TITLES: Record<string, string> = {
  "/profile/oferta": "Oferta",
  "/profile/konto": "Konto",
};

function getPageTitle(pathname: string): string | undefined {
  if (TAB_TITLES[pathname]) return TAB_TITLES[pathname];
  if (pathname.startsWith("/profile/orders/")) return "Rezerwacja";
  if (pathname.startsWith("/profile/messages/")) return "Wiadomość";
  return undefined;
}

function BackButton() {
  const router = useRouter();
  const { isBlocked, openModal } = useNavigationBlocker();

  const handleBack = () => {
    const goBack = () => startTransition(() => router.back());
    if (isBlocked) {
      openModal(goBack);
    } else {
      goBack();
    }
  };

  return (
    <button onClick={handleBack} aria-label="Wróć">
      <div className="h-10 w-10 bg-gray-100 rounded-full text-black flex items-center justify-center hover:bg-gray-200 duration-200">
        <IoChevronBack className="h-6 w-6 ml-[-2px]" />
      </div>
    </button>
  );
}

export function DashboardTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const areClassesEnabled = useFeatureFlag(FEATURE_FLAGS.classes);
  const isMainTab = MAIN_TAB_PATHS.includes(pathname);
  const title = getPageTitle(pathname);
  const showPlus = pathname === "/profile/oferta";

  const handlePlus = () => {
    const filter = searchParams.get("filter");
    const directPath = getOfertaCreatePath(filter, areClassesEnabled);
    if (directPath) {
      router.push(directPath);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("create", "true");
      router.push(`/profile/oferta?${params.toString()}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b h-16 md:h-20 relative flex items-center px-5 md:px-8">
      {isMainTab ? (
        <LinkWithBlocker href="/" aria-label="Strona główna" className="shrink-0">
          <LogoFooter />
        </LinkWithBlocker>
      ) : (
        <BackButton />
      )}

      {title && (
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-900 pointer-events-none">
          {title}
        </h1>
      )}

      {showPlus && (
        <button
          type="button"
          aria-label="Dodaj nowe ogłoszenie"
          onClick={handlePlus}
          className="ml-auto h-10 w-10 bg-gray-100 rounded-full text-black flex items-center justify-center hover:bg-gray-200 duration-200"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </header>
  );
}
