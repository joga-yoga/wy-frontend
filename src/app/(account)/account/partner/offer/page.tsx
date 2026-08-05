"use client";

import {
  Building2,
  Calendar,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  ImageIcon,
  MoreVertical,
  Mountain,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOfferCreateMenu } from "@/context/OfferCreateMenuContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { formatDateRange } from "@/lib/formatDateRange";
import { cn } from "@/lib/utils";

import { isPastEvent, sortForOffer } from "./eventKind";
import { BaseEvent, DashboardItem } from "./offerConfig";
import { OfferEventRow } from "./OfferEventRow";

/** Rows shown per type before "Pokaż wszystkie" expands the rest in place. */
const VISIBLE_PER_SECTION = 2;

/** The delete/hide/duplicate handlers every row shares, passed down as one object. */
type OfferRowActions = Omit<React.ComponentProps<typeof OfferEventRow>, "event" | "organizerLabel">;

// ─── Types ───────────────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getEventStatus = (event: BaseEvent) => {
  if (!event.is_public) {
    return { text: "Prywatne", className: "bg-gray-100 text-gray-700 border border-gray-300" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = event.end_date ? new Date(event.end_date) : null;
  if (end && end < today)
    return { text: "Minęło", className: "bg-b2b-amber-bg text-b2b-amber-text" };
  return { text: "Publiczne", className: "bg-green-100 text-green-800" };
};

function editLink(item: DashboardItem) {
  if (item.kind === "workshop") return `/konto/partner/wydarzenia/${item.id}/edit`;
  if (item.kind === "course") return `/konto/partner/kursy/${item.id}/edit`;
  return `/konto/partner/wyjazdy/${item.id}/edit`;
}

function publicLink(item: DashboardItem): string | null {
  if (item.kind === "workshop") return `/wydarzenia/${item.slug}`;
  if (item.kind === "course") return null;
  return `/wyjazdy/${item.slug}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Upcoming/active first, past last — within each type's section. */
function sortActiveFirst(items: DashboardItem[]): DashboardItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = (i: DashboardItem) => {
    const end = i.end_date ? new Date(i.end_date) : null;
    return end != null && end < today;
  };
  return [...items].sort((a, b) => Number(isPast(a)) - Number(isPast(b)));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferPage() {
  const [retreats, setRetreats] = useState<DashboardItem[]>([]);
  const [workshops, setWorkshops] = useState<DashboardItem[]>([]);
  const [courses, setCourses] = useState<DashboardItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<DashboardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [organizerLabels, setOrganizerLabels] = useState<Record<string, string[]>>({});
  const [showOrganizerLabels, setShowOrganizerLabels] = useState(false);

  const { toast } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();
  // One list, so the sort can actually order the whole offer rather than three slices of two.
  const allItems = useMemo(
    () => [...retreats, ...workshops, ...courses],
    [retreats, workshops, courses],
  );
  const { isCreateMenuOpen, setIsCreateMenuOpen } = useOfferCreateMenu();

  const hasAnyEvents = retreats.length > 0 || workshops.length > 0 || courses.length > 0;

  // Fetch events
  useEffect(() => {
    Promise.all([
      axiosInstance
        .get<BaseEvent[]>("/retreats")
        .then((r) => r.data.map((e) => ({ ...e, kind: "retreat" as const })))
        .catch(() => []),
      axiosInstance
        .get<BaseEvent[]>("/workshops")
        .then((r) => r.data.map((e) => ({ ...e, kind: "workshop" as const })))
        .catch(() => []),
      axiosInstance
        .get<BaseEvent[]>("/courses")
        .then((r) => r.data.map((e) => ({ ...e, kind: "course" as const })))
        .catch(() => []),
    ])
      .then(([r, w, co]) => {
        setRetreats(sortActiveFirst(r));
        setWorkshops(sortActiveFirst(w));
        setCourses(sortActiveFirst(co));

        // "jako: X" chips (spec-b2b §4) — one call for every rendered id; the backend
        // tells us whether to show them at all (only once the partner has 2+ entities).
        const eventIds = [...r, ...w, ...co].map((e) => e.id);
        if (eventIds.length > 0) {
          axiosInstance
            .post("/events/organizer-labels", { event_ids: eventIds })
            .then(({ data }) => {
              setOrganizerLabels(data.labels ?? {});
              setShowOrganizerLabels(Boolean(data.show_labels));
            })
            .catch(() => {});
        }
      })
      .finally(() => setLoadingItems(false));
  }, []);

  const getOrganizerLabel = useCallback(
    (id: string) => (showOrganizerLabels ? organizerLabels[id]?.join(" · ") : undefined),
    [showOrganizerLabels, organizerLabels],
  );

  // Fetch instructors and claim invitations
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const ep =
        itemToDelete.kind === "workshop"
          ? "/workshops"
          : itemToDelete.kind === "course"
            ? "/courses"
            : "/retreats";
      await axiosInstance.delete(`${ep}/${itemToDelete.id}`);
      toast({ description: "Usunięto pomyślnie!" });
      if (itemToDelete.kind === "retreat")
        setRetreats((p) => p.filter((i) => i.id !== itemToDelete.id));
      else if (itemToDelete.kind === "workshop")
        setWorkshops((p) => p.filter((i) => i.id !== itemToDelete.id));
      else setCourses((p) => p.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        description: `Nie udało się usunąć: ${error.response?.data?.detail || error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHide = async (event: DashboardItem) => {
    try {
      const ep =
        event.kind === "workshop"
          ? "/workshops"
          : event.kind === "course"
            ? "/courses"
            : "/retreats";
      await axiosInstance.patch(`${ep}/${event.id}`, { is_public: false });
      toast({ description: "Ukryto pomyślnie!" });
      const updater = (p: DashboardItem[]) =>
        p.map((i) => (i.id === event.id ? { ...i, is_public: false } : i));
      if (event.kind === "retreat") setRetreats(updater);
      else if (event.kind === "workshop") setWorkshops(updater);
      else setCourses(updater);
    } catch (error: any) {
      toast({
        description: `Nie udało się ukryć: ${error.response?.data?.detail || error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (event: DashboardItem) => {
    try {
      const ep =
        event.kind === "workshop"
          ? "/workshops"
          : event.kind === "course"
            ? "/courses"
            : "/retreats";
      const { data: full } = await axiosInstance.get(`${ep}/${event.id}`);
      let payload: any = {
        title: full.title,
        description: full.description,
        image_ids: full.image_ids,
        price: full.price,
        currency: full.currency,
        language: full.language,
        cancellation_policy: full.cancellation_policy,
        important_info: full.important_info,
        program: full.program,
        instructor_ids: full.instructors?.map((i: any) => i.id) || [],
        location_id: full.location?.id || null,
        is_public: false,
      };
      if (event.kind === "course") {
        payload = {
          title: full.title,
          description: full.description,
          image_ids: full.image_ids,
          is_public: false,
        };
      } else if (event.kind === "retreat") {
        payload = {
          ...payload,
          main_attractions: full.main_attractions,
          skill_level: full.skill_level,
          food_description: full.food_description,
          price_includes: full.price_includes,
          price_excludes: full.price_excludes,
          accommodation_description: full.accommodation_description,
          guest_welcome_description: full.guest_welcome_description,
          paid_attractions: full.paid_attractions,
        };
      } else {
        payload = {
          ...payload,
          is_online: full.is_online,
          is_onsite: full.is_onsite,
          goals: full.goals,
          tags: full.tags,
        };
      }
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) payload[k] = null;
      });
      sessionStorage.setItem("duplicateEventData", JSON.stringify(payload));
      const createPath =
        event.kind === "workshop"
          ? "/konto/partner/wydarzenia/create?duplicate=true"
          : event.kind === "course"
            ? "/konto/partner/kursy/create?duplicate=true"
            : "/konto/partner/wyjazdy/create?duplicate=true";
      router.push(createPath);
      toast({ description: "Duplikowanie..." });
    } catch (error: any) {
      toast({ description: `Nie udało się zduplikować: ${error.message}`, variant: "destructive" });
    }
  };

  const cardProps = {
    onDelete: setItemToDelete,
    onHide: handleHide,
    onDuplicate: handleDuplicate,
    itemToDelete,
    isDeleting,
    onDeleteConfirm: handleDelete,
    onDeleteCancel: () => setItemToDelete(null),
  };

  const isLoading = loadingItems;

  // ── "Wszystkie" view ──────────────────────────────────────────────────────

  return (
    <>
      {/* "Co chcesz dodać?" drawer */}
      <Drawer open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen} showSwipeHandle>
        <DrawerContent className="sm:mx-auto sm:max-w-2xl">
          <div className="flex items-start justify-between px-4 pt-4">
            <div className="min-w-0 pr-3">
              <DrawerTitle className="text-2xl font-semibold">Co chcesz dodać?</DrawerTitle>
              <DrawerDescription className="mt-0.5">Wybierz typ ogłoszenia.</DrawerDescription>
            </div>
            <DrawerClose
              aria-label="Zamknij"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <X className="h-4 w-4" />
            </DrawerClose>
          </div>
          <div className="space-y-3 p-4 pt-2">
            <div className="rounded-b2b border bg-white overflow-hidden divide-y">
              {OFFER_TYPE_ROWS.map(({ href, title, description, Icon, badgeClassName }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsCreateMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      badgeClassName,
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 truncate">{description}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
            <Link
              href="/konto/partner/instruktorzy/create"
              onClick={() => setIsCreateMenuOpen(false)}
              className="flex items-center gap-3 rounded-b2b border bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-b2b-green-text">
                <Users size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Profil instruktora</p>
                <p className="text-xs text-gray-500 truncate">Dodaj instruktora do swojego konta</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </Link>
          </div>
        </DrawerContent>
      </Drawer>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {hasAnyEvents ? (
            <OfferList
              items={allItems}
              cardProps={cardProps}
              getOrganizerLabel={getOrganizerLabel}
            />
          ) : (
            <OfferEmptyState />
          )}
        </div>
      )}
    </>
  );
}

// ─── WelcomeBanner ───────────────────────────────────────────────────────────

const OFFER_TYPE_ROWS = [
  {
    href: "/konto/partner/wyjazdy/create",
    title: "Wyjazd",
    description: "Kilkudniowy retreat z zakwaterowaniem",
    Icon: Mountain,
    badgeClassName: "bg-b2b-green-bg text-b2b-green-text",
  },
  {
    href: "/konto/partner/wydarzenia/create",
    title: "Wydarzenie",
    description: "Spotkanie, jednorazowa praktyka",
    Icon: Sparkles,
    badgeClassName: "bg-b2b-amber-bg text-b2b-amber-text",
  },
  {
    href: "/konto/partner/kursy/create",
    title: "Kurs",
    description: "Cykl spotkań z zapisami na całość",
    Icon: GraduationCap,
    badgeClassName: "bg-violet-100 text-violet-700",
  },
] as const;

/** spec-b2b §5: one primary CTA + a type education card. Type is chosen by picking
 * a row here, never inferred — the empty state itself stays type-agnostic. */
function OfferEmptyState() {
  const { setIsCreateMenuOpen } = useOfferCreateMenu();

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white py-10 px-6 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <Tag size={22} className="text-gray-400" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-gray-900">Twoja oferta jest pusta</p>
          <p className="text-sm text-gray-500">
            Dodaj wyjazd, wydarzenie lub kurs — stworzymy publiczną stronę z linkiem do
            udostępniania i zaczniemy zbierać rezerwacje.
          </p>
        </div>
        <Button size="action" variant="green" onClick={() => setIsCreateMenuOpen(true)}>
          Dodaj wydarzenie
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Typy wydarzeń
        </h2>
        <div className="rounded-b2b border bg-white overflow-hidden divide-y">
          {OFFER_TYPE_ROWS.map(({ href, title, description, Icon, badgeClassName }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  badgeClassName,
                )}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 truncate">{description}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── OfferList ────────────────────────────────────────────────────────────────

/**
 * One list for the whole offer, replacing four per-type sections that each showed two
 * items behind a "Pokaż wszystkie".
 *
 * The sections were doing two jobs: telling you what a row was, and keeping the page
 * short. The first is now the row's own badge and thumbnail tint; the second was costing
 * more than it saved — a partner with five wyjazdy could see two of them, and the only
 * way to compare across types was to expand all four groups.
 */
function OfferList({
  items,
  cardProps,
  getOrganizerLabel,
}: {
  items: DashboardItem[];
  cardProps: OfferRowActions;
  getOrganizerLabel?: (id: string) => string | undefined;
}) {
  const { setIsCreateMenuOpen } = useOfferCreateMenu();
  const [showArchive, setShowArchive] = useState(false);

  const { live, past } = useMemo(() => {
    const live: DashboardItem[] = [];
    const past: DashboardItem[] = [];
    for (const item of items) (isPastEvent(item) ? past : live).push(item);
    return {
      live: sortForOffer(live),
      // Most-recently-finished first: the archive is read backwards from today.
      past: [...past].sort(
        (a, b) =>
          new Date(b.end_date ?? b.start_date ?? 0).getTime() -
          new Date(a.end_date ?? a.start_date ?? 0).getTime(),
      ),
    };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="divide-y overflow-hidden rounded-b2b border bg-white">
        {live.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-gray-400">
            Brak nadchodzących wydarzeń.
          </p>
        ) : (
          live.map((event) => (
            <OfferEventRow
              key={event.id}
              event={event}
              {...cardProps}
              organizerLabel={getOrganizerLabel?.(event.id)}
            />
          ))
        )}

        {/* The add row opens the type picker rather than linking to one type — with the
            sections gone there is no longer a type in context to infer. */}
        <button
          type="button"
          onClick={() => setIsCreateMenuOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 px-4 py-3.5 text-sm font-semibold text-b2b-green-strong transition-colors hover:bg-gray-50"
        >
          <Plus size={16} />
          Dodaj wydarzenie
        </button>
      </div>

      {/* Archive. Collapsed by default: past events are worth keeping and not worth
          scrolling past every time the partner opens the tab. */}
      {past.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setShowArchive((v) => !v)}
            aria-expanded={showArchive}
            className="flex w-full items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400"
          >
            <span>Archiwum · {past.length}</span>
            <ChevronRight
              size={16}
              className={cn("transition-transform", showArchive && "rotate-90")}
            />
          </button>

          {showArchive && (
            <div className="divide-y overflow-hidden rounded-b2b border bg-white">
              {past.map((event) => (
                <OfferEventRow
                  key={event.id}
                  event={event}
                  {...cardProps}
                  organizerLabel={getOrganizerLabel?.(event.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
