"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { IoChevronBack } from "react-icons/io5";

import { LinkWithBlocker } from "@/app/(account)/account/partner/components/EventForm/block-navigation/link";
import { useNavigationBlocker } from "@/app/(account)/account/partner/components/EventForm/block-navigation/navigation-block";
import { getOfferCreatePath } from "@/app/(account)/account/partner/offer/offerConfig";
import { LogoFooter } from "@/components/layout/Footer";
import { useOfferCreateMenu } from "@/context/OfferCreateMenuContext";
import { FEATURE_FLAGS, useFeatureFlag } from "@/lib/featureFlags";

const MAIN_TAB_PATHS = ["/konto/partner", "/konto/partner/oferta", "/konto/partner/konto"];
const BECOME_PARTNER_PATH = "/konto/partner/zostan-partnerem";

const TAB_TITLES: Record<string, string> = {
  "/konto/partner/oferta": "Oferta",
  "/konto/partner/konto": "Konto",
};

function getPageTitle(pathname: string): string | undefined {
  if (TAB_TITLES[pathname]) return TAB_TITLES[pathname];
  if (pathname.startsWith("/konto/partner/zamowienia/")) return "Rezerwacja";
  if (pathname.startsWith("/konto/partner/wiadomosci/")) return "Wiadomość";
  if (pathname.startsWith("/konto/partner/instruktorzy/") && pathname.endsWith("/edit"))
    return "Edytuj instruktora";
  if (pathname === "/konto/partner/instruktorzy/create") return "Nowy instruktor";
  if (pathname === "/konto/partner/wyjazdy/create") return "Nowy wyjazd";
  if (pathname === "/konto/partner/wydarzenia/create") return "Nowe wydarzenie";
  if (pathname === "/konto/partner/kursy/create") return "Nowy kurs";
  if (pathname.startsWith("/konto/partner/kursy/") && pathname.endsWith("/edit"))
    return "Edytuj kurs";
  if (pathname === "/konto/partner/studio/create") return "Nowe studio";
  if (pathname.startsWith("/konto/partner/studio/") && pathname.endsWith("/edit"))
    return "Edytuj studio";
  if (pathname === "/konto/partner/szablony-zajec") return "Szablony zajęć";
  if (pathname === "/konto/partner/szablony-zajec/create") return "Nowy szablon";
  if (pathname.startsWith("/konto/partner/szablony-zajec/") && pathname.endsWith("/edit"))
    return "Edytuj szablon";
  if (pathname === "/konto/partner/grafiki-zajec/create") return "Dodaj zajęcia";
  if (pathname === "/konto/partner/grafik") return "Grafik";
  if (pathname === "/konto/partner/grafik/instructor") return "Mój grafik";
  if (pathname.startsWith("/konto/partner/grafik/edit/")) return "Edytuj sesję";
  if (pathname.startsWith("/konto/partner/grafik/cancel/")) return "Odwołaj sesję";
  return undefined;
}

function getBackHref(pathname: string): string | undefined {
  if (pathname === "/konto/partner/grafik") return "/konto/partner";
  if (pathname === "/konto/partner/grafik/instructor") return "/konto/partner";
  if (pathname.startsWith("/konto/partner/grafik/edit/")) return "/konto/partner/grafik";
  if (pathname.startsWith("/konto/partner/grafik/cancel/")) return "/konto/partner/grafik";
  if (pathname === "/konto/partner/grafiki-zajec/create") return "/konto/partner/grafik";
  if (pathname === "/konto/partner/szablony-zajec") return "/konto/partner/oferta";
  if (pathname === "/konto/partner/szablony-zajec/create") return "/konto/partner/szablony-zajec";
  if (pathname.startsWith("/konto/partner/szablony-zajec/") && pathname.endsWith("/edit"))
    return "/konto/partner/szablony-zajec";
  if (pathname === "/konto/partner/studio/create") return "/konto/partner/oferta";
  if (pathname.startsWith("/konto/partner/studio/") && pathname.endsWith("/edit"))
    return "/konto/partner/oferta";
  if (pathname === "/konto/partner/instruktorzy") return "/konto/partner/oferta";
  if (pathname === "/konto/partner/instruktorzy/create") return "/konto/partner/instruktorzy";
  if (pathname.startsWith("/konto/partner/instruktorzy/") && pathname.endsWith("/edit"))
    return "/konto/partner/instruktorzy";
  return undefined;
}

function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { isBlocked, openModal } = useNavigationBlocker();

  const handleBack = () => {
    const href = getBackHref(pathname);
    const navigate = href
      ? () => startTransition(() => router.push(href))
      : () => startTransition(() => router.back());
    if (isBlocked) {
      openModal(navigate);
    } else {
      navigate();
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
  const { openCreateMenu } = useOfferCreateMenu();
  const isMainTab = MAIN_TAB_PATHS.includes(pathname);
  // On become-partner the user has no partner profile yet, so back-navigation can
  // only lead into guarded pages (or the login bounce). Show the logo as a safe
  // exit to the public site instead of a back button.
  const showHomeLogo = isMainTab || pathname === BECOME_PARTNER_PATH;
  const title = getPageTitle(pathname);
  const showPlus = pathname === "/konto/partner/oferta";

  const handlePlus = () => {
    const filter = searchParams.get("filter");
    const directPath = getOfferCreatePath(filter, areClassesEnabled);
    if (directPath) {
      router.push(directPath);
    } else {
      openCreateMenu();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b h-16 md:h-20 relative flex items-center px-4 md:px-6">
      {showHomeLogo ? (
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
