"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { IoChevronBack } from "react-icons/io5";

import { LinkWithBlocker } from "@/app/profile/(dashboard)/components/EventForm/block-navigation/link";
import { useNavigationBlocker } from "@/app/profile/(dashboard)/components/EventForm/block-navigation/navigation-block";
import { getOfferCreatePath } from "@/app/profile/(dashboard)/offer/offerConfig";
import { LogoFooter } from "@/components/layout/Footer";
import { FEATURE_FLAGS, useFeatureFlag } from "@/lib/featureFlags";

const MAIN_TAB_PATHS = ["/profile", "/profile/offer", "/profile/account"];
const BECOME_PARTNER_PATH = "/profile/become-partner";

const TAB_TITLES: Record<string, string> = {
  "/profile/offer": "Oferta",
  "/profile/account": "Konto",
};

function getPageTitle(pathname: string): string | undefined {
  if (TAB_TITLES[pathname]) return TAB_TITLES[pathname];
  if (pathname.startsWith("/profile/orders/")) return "Rezerwacja";
  if (pathname.startsWith("/profile/messages/")) return "Wiadomość";
  if (pathname.startsWith("/profile/instructors/") && pathname.endsWith("/edit"))
    return "Edytuj instruktora";
  if (pathname === "/profile/instructors/create") return "Nowy instruktor";
  if (pathname === "/profile/retreats/create") return "Nowy wyjazd";
  if (pathname === "/profile/workshops/create") return "Nowe wydarzenie";
  if (pathname === "/profile/courses/create") return "Nowy kurs";
  if (pathname.startsWith("/profile/courses/") && pathname.endsWith("/edit")) return "Edytuj kurs";
  if (pathname === "/profile/studio/create") return "Nowe studio";
  if (pathname.startsWith("/profile/studio/") && pathname.endsWith("/edit")) return "Edytuj studio";
  if (pathname === "/profile/class-templates") return "Szablony zajęć";
  if (pathname === "/profile/class-templates/create") return "Nowy szablon";
  if (pathname.startsWith("/profile/class-templates/") && pathname.endsWith("/edit"))
    return "Edytuj szablon";
  if (pathname === "/profile/class-schedules/create") return "Dodaj zajęcia";
  if (pathname === "/profile/schedule") return "Grafik";
  if (pathname === "/profile/schedule/instructor") return "Mój grafik";
  if (pathname.startsWith("/profile/schedule/edit/")) return "Edytuj sesję";
  if (pathname.startsWith("/profile/schedule/cancel/")) return "Odwołaj sesję";
  return undefined;
}

function getBackHref(pathname: string): string | undefined {
  if (pathname === "/profile/schedule") return "/profile";
  if (pathname === "/profile/schedule/instructor") return "/profile";
  if (pathname.startsWith("/profile/schedule/edit/")) return "/profile/schedule";
  if (pathname.startsWith("/profile/schedule/cancel/")) return "/profile/schedule";
  if (pathname === "/profile/class-schedules/create") return "/profile/schedule";
  if (pathname === "/profile/class-templates") return "/profile/offer";
  if (pathname === "/profile/class-templates/create") return "/profile/class-templates";
  if (
    pathname.startsWith("/profile/class-templates/") &&
    pathname.endsWith("/edit")
  )
    return "/profile/class-templates";
  if (pathname === "/profile/studio/create") return "/profile/offer";
  if (
    pathname.startsWith("/profile/studio/") &&
    pathname.endsWith("/edit")
  )
    return "/profile/offer";
  if (pathname === "/profile/instructors") return "/profile/offer";
  if (pathname === "/profile/instructors/create") return "/profile/instructors";
  if (
    pathname.startsWith("/profile/instructors/") &&
    pathname.endsWith("/edit")
  )
    return "/profile/instructors";
  return undefined;
}

function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { isBlocked, openModal } = useNavigationBlocker();

  const handleBack = () => {
    const href = getBackHref(pathname);
    const navigate = href ? () => startTransition(() => router.push(href)) : () => startTransition(() => router.back());
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
  const isMainTab = MAIN_TAB_PATHS.includes(pathname);
  // On become-partner the user has no partner profile yet, so back-navigation can
  // only lead into guarded pages (or the login bounce). Show the logo as a safe
  // exit to the public site instead of a back button.
  const showHomeLogo = isMainTab || pathname === BECOME_PARTNER_PATH;
  const title = getPageTitle(pathname);
  const showPlus = pathname === "/profile/offer";

  const handlePlus = () => {
    const filter = searchParams.get("filter");
    const directPath = getOfferCreatePath(filter, areClassesEnabled);
    if (directPath) {
      router.push(directPath);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("create", "true");
      router.push(`/profile/offer?${params.toString()}`);
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
