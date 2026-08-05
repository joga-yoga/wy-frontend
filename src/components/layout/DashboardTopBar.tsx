"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { IoChevronBack, IoClose } from "react-icons/io5";

import { LinkWithBlocker } from "@/app/account/partner/components/EventForm/block-navigation/link";
import { useNavigationBlocker } from "@/app/account/partner/components/EventForm/block-navigation/navigation-block";
import { TAB_PATHS } from "@/components/layout/BottomTabBar";
import { LogoFooter } from "@/components/layout/Footer";
import { HeaderAvatar } from "@/components/layout/HeaderAvatar";
import {
  usePageHeaderAction,
  usePageSubtitle,
  usePageTitleOverride,
} from "@/context/PageHeaderContext";

const BECOME_PARTNER_PATH = "/konto/partner/zostan-partnerem";

/**
 * Screens the prototypes draw as modals (R3, R4, U3): an X rather than a back chevron.
 *
 * The X is not a different destination — it still resolves through `getBackHref`, so a
 * flow carrying `studioId` or `?step=new` keeps it. Only the affordance changes: a chevron
 * says "one step back", an X says "leave this task".
 */
function isModalScreen(pathname: string): boolean {
  return (
    pathname === "/konto/partner/instruktorzy/create" ||
    pathname === "/konto/partner/grafiki-zajec/create"
  );
}

const TAB_TITLES: Record<string, string> = {
  "/konto/partner/grafik": "Grafik",
  "/konto/partner/rezerwacje": "Rezerwacje",
  "/konto/partner/oferta": "Oferta",
  "/konto/partner/menu": "Menu",
  "/konto/partner/konto": "Konto",
};

function getPageTitle(pathname: string, searchParams: URLSearchParams): string | undefined {
  if (TAB_TITLES[pathname]) return TAB_TITLES[pathname];
  if (/^\/konto\/partner\/rezerwacje\/[^/]+$/.test(pathname)) return "Wiadomość";
  if (pathname === "/konto/partner/instruktorzy") return "Instruktorzy";
  if (pathname.startsWith("/konto/partner/instruktorzy/") && pathname.endsWith("/edit"))
    return "Edytuj instruktora";
  if (pathname === "/konto/partner/instruktorzy/create")
    return searchParams.get("step") === "new" ? "Nowy instruktor" : "Dodaj instruktora";
  if (pathname === "/konto/partner/klienci") return "Klienci";
  // Ordering trap, same shape that bit the roster/sell-pass pair: the /karnety and
  // /wizyty leaves both also match the bare `klienci/<id>` pattern below, so they are
  // tested first.
  if (pathname.startsWith("/konto/partner/klienci/") && pathname.endsWith("/karnety"))
    return "Karnety klienta";
  if (pathname === "/konto/partner/rozliczenia") return "Do rozliczenia";
  // sell-pass must be tested before the roster pattern — it also matches `/front-desk/<seg>`.
  if (/^\/konto\/partner\/studio\/[^/]+\/front-desk\/sell-pass$/.test(pathname))
    return "Sprzedaj karnet";
  // The session screen (spec §3) titles itself by class name via `useSetPageTitle` once its
  // own data loads — no static fallback here, same pattern as the instructor detail screen.
  if (pathname.startsWith("/konto/partner/klienci/") && pathname.endsWith("/wizyty"))
    return "Historia wizyt";
  if (/^\/konto\/partner\/klienci\/[^/]+$/.test(pathname)) return "Klient";
  if (pathname === "/konto/partner/wyjazdy/create") return "Nowy wyjazd";
  if (pathname === "/konto/partner/wydarzenia/create") return "Nowe wydarzenie";
  if (pathname === "/konto/partner/kursy/create") return "Nowy kurs";
  if (pathname.startsWith("/konto/partner/kursy/") && pathname.endsWith("/edit"))
    return "Edytuj kurs";
  if (pathname === "/konto/partner/studio/create") return "Nowe studio";
  if (pathname.startsWith("/konto/partner/studio/") && pathname.endsWith("/edit"))
    return "Edytuj studio";
  if (pathname.startsWith("/konto/partner/studio/") && pathname.endsWith("/payments"))
    return "Płatności i odwołania";
  if (pathname.startsWith("/konto/partner/menu/studio/")) return "Studio";
  if (pathname === "/konto/partner/szablony-zajec") return "Szablony zajęć";
  if (pathname === "/konto/partner/szablony-zajec/create") return "Nowy szablon";
  if (pathname.startsWith("/konto/partner/szablony-zajec/") && pathname.endsWith("/edit"))
    return "Edytuj szablon";
  if (pathname === "/konto/partner/grafiki-zajec/create") return "Dodaj zajęcia";
  if (pathname === "/konto/partner/grafik/instructor") return "Mój grafik";
  if (pathname.startsWith("/konto/partner/grafik/edit/")) {
    // Zastępstwo enters the same edit pipeline through a different door (S8), and its
    // header names that door rather than the pipeline.
    return searchParams.get("field") === "instructor" ? "Zmień prowadzącego" : "Edytuj sesję";
  }
  if (pathname.startsWith("/konto/partner/grafik/cancel/")) return "Odwołaj sesję";
  return undefined;
}

function getBackHref(pathname: string, searchParams: URLSearchParams): string | undefined {
  if (pathname === "/konto/partner/grafik/instructor") return "/konto/partner/grafik";
  if (pathname.startsWith("/konto/partner/grafik/edit/")) return "/konto/partner/grafik";
  if (pathname.startsWith("/konto/partner/grafik/cancel/")) return "/konto/partner/grafik";
  if (pathname === "/konto/partner/grafiki-zajec/create") return "/konto/partner/grafik";
  if (pathname === "/konto/partner/konto") return "/konto/partner/menu";
  if (pathname === "/konto/partner/szablony-zajec") return "/konto/partner/oferta";
  if (pathname === "/konto/partner/szablony-zajec/create") return "/konto/partner/szablony-zajec";
  if (pathname.startsWith("/konto/partner/szablony-zajec/") && pathname.endsWith("/edit"))
    return "/konto/partner/szablony-zajec";
  if (pathname === "/konto/partner/studio/create") return "/konto/partner/menu";
  if (pathname.startsWith("/konto/partner/studio/") && pathname.endsWith("/edit"))
    return "/konto/partner/menu";
  if (pathname.startsWith("/konto/partner/studio/") && pathname.endsWith("/payments"))
    return "/konto/partner/menu";
  if (pathname.startsWith("/konto/partner/menu/studio/")) return "/konto/partner/menu";
  if (pathname === "/konto/partner/instruktorzy") return "/konto/partner/menu";
  if (pathname === "/konto/partner/instruktorzy/create") {
    // Studio-scoped roster screens carry `studioId` through every step — never let a
    // 2+-studio partner's back-navigation silently drop which studio they were in.
    const studioQuery = searchParams.get("studioId")
      ? `?studioId=${searchParams.get("studioId")}`
      : "";
    // Stub step (R4) backs up into the email step (R3), not all the way out.
    return searchParams.get("step") === "new"
      ? `/konto/partner/instruktorzy/create${studioQuery}`
      : `/konto/partner/instruktorzy${studioQuery}`;
  }
  if (pathname.startsWith("/konto/partner/instruktorzy/") && pathname.endsWith("/edit"))
    return "/konto/partner/instruktorzy";
  if (/^\/konto\/partner\/instruktorzy\/[^/]+$/.test(pathname)) {
    const studioQuery = searchParams.get("studioId")
      ? `?studioId=${searchParams.get("studioId")}`
      : "";
    return `/konto/partner/instruktorzy${studioQuery}`;
  }
  if (pathname === "/konto/partner/klienci") return "/konto/partner/menu";
  if (pathname === "/konto/partner/rozliczenia") return "/konto/partner/grafik";
  // Same ordering trap as the titles: sell-pass matches the roster pattern too, and it is
  // reached *from* a roster, so it must go back there rather than out to Grafik.
  const sellPass = pathname.match(/^(\/konto\/partner\/studio\/[^/]+\/front-desk)\/sell-pass$/);
  if (sellPass) {
    const occurrenceId = searchParams.get("occurrenceId");
    return occurrenceId ? `${sellPass[1]}/${occurrenceId}` : "/konto/partner/grafik";
  }
  if (/^\/konto\/partner\/studio\/[^/]+\/front-desk\/[^/]+$/.test(pathname))
    return "/konto/partner/grafik";
  if (pathname.startsWith("/konto/partner/klienci/") && pathname.endsWith("/karnety")) {
    const studioQuery = searchParams.get("studioId")
      ? `?studioId=${searchParams.get("studioId")}`
      : "";
    return `${pathname.replace(/\/karnety$/, "")}${studioQuery}`;
  }
  if (pathname.startsWith("/konto/partner/klienci/") && pathname.endsWith("/wizyty")) {
    const studioQuery = searchParams.get("studioId")
      ? `?studioId=${searchParams.get("studioId")}`
      : "";
    return `${pathname.replace(/\/wizyty$/, "")}${studioQuery}`;
  }
  if (/^\/konto\/partner\/klienci\/[^/]+$/.test(pathname)) {
    const studioQuery = searchParams.get("studioId")
      ? `?studioId=${searchParams.get("studioId")}`
      : "";
    return `/konto/partner/klienci${studioQuery}`;
  }
  if (/^\/konto\/partner\/rezerwacje\/[^/]+$/.test(pathname)) return "/konto/partner/rezerwacje";
  return undefined;
}

function BackButton({ variant = "back" }: { variant?: "back" | "close" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isBlocked, openModal } = useNavigationBlocker();

  const handleBack = () => {
    const href = getBackHref(pathname, searchParams);
    const navigate = href
      ? () => startTransition(() => router.push(href))
      : () => startTransition(() => router.back());
    if (isBlocked) {
      openModal(navigate);
    } else {
      navigate();
    }
  };

  const isClose = variant === "close";
  return (
    <button onClick={handleBack} aria-label={isClose ? "Zamknij" : "Wróć"}>
      <div className="h-10 w-10 bg-gray-100 rounded-full text-black flex items-center justify-center hover:bg-gray-200 duration-200">
        {isClose ? (
          <IoClose className="h-5 w-5" />
        ) : (
          <IoChevronBack className="h-5 w-5 ml-[-2px]" />
        )}
      </div>
    </button>
  );
}

/**
 * Two header modes, per the prototypes:
 *
 * - **Main tab** — no logo, the tab name as a large left-aligned title, avatar right.
 *   The title lives here and *only* here; the tab pages no longer render their own `<h1>`,
 *   which is what used to show "Grafik" twice.
 * - **Inner screen** — back chevron with the title immediately beside it (not centred),
 *   plus an optional subtitle pushed up by the screen via `useSetPageSubtitle`.
 *
 * Height is fixed at h-16/md:h-20 and mirrored by `--dashboard-header-h` in globals.css,
 * so sticky sub-headers (Grafik's week nav + day strip) can offset from it. The subtitle
 * is absolutely positioned so adding one cannot change that height and desync the two.
 */
export function DashboardTopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMainTab = (TAB_PATHS as readonly string[]).includes(pathname);
  // On become-partner the user has no partner profile yet, so back-navigation can
  // only lead into guarded pages (or the login bounce). Show the logo as a safe
  // exit to the public site instead of a back button.
  const isBecomePartner = pathname === BECOME_PARTNER_PATH;
  const isModal = isModalScreen(pathname);
  const titleOverride = usePageTitleOverride();
  // A screen-supplied title wins over the route map: only the screen knows its subject's
  // name. The map still covers every screen that has a fixed title.
  const title = titleOverride ?? getPageTitle(pathname, searchParams);
  const subtitle = usePageSubtitle();
  const headerAction = usePageHeaderAction();

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center gap-3 bg-background px-4 md:h-20 md:px-6">
      {isMainTab ? (
        <>
          {title && <h1 className="truncate text-2xl font-bold text-gray-900">{title}</h1>}
          <div className="ml-auto flex items-center gap-2">
            <HeaderAvatar />
          </div>
        </>
      ) : isBecomePartner ? (
        <LinkWithBlocker href="/" aria-label="Strona główna" className="shrink-0">
          <LogoFooter />
        </LinkWithBlocker>
      ) : (
        <>
          <BackButton variant={isModal ? "close" : "back"} />
          {title && (
            <div className="relative min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="truncate text-sm font-semibold text-gray-400">{subtitle}</p>
              )}
            </div>
          )}
          {headerAction}
        </>
      )}
    </header>
  );
}
