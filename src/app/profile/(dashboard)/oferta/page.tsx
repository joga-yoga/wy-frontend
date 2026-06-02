"use client";

import { Calendar, ChevronRight, ExternalLink, MoreVertical, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { FEATURE_FLAGS, useFeatureFlag } from "@/lib/featureFlags";
import { formatDateRange } from "@/lib/formatDateRange";
import { cn } from "@/lib/utils";

import {
  BaseEvent,
  DashboardItem,
  FilterType,
  getOfertaFilterPills,
  getOfertaSingleTypeViewConfig,
  isOfertaFilterEnabled,
} from "./ofertaConfig";

// ─── Types ───────────────────────────────────────────────────────────────────

interface YogaStyle {
  id: string;
  description: string;
  yoga_style: {
    id: string;
    name: string;
    slug: string;
  };
}

interface InstructorItem {
  id: string;
  name: string;
  image_id: string | null;
  short_bio: string | null;
  slug: string | null;
  yoga_styles: YogaStyle[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getEventStatus = (event: BaseEvent) => {
  if (!event.is_public) {
    return { text: "Prywatne", className: "bg-gray-100 text-gray-700 border border-gray-300" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = event.end_date ? new Date(event.end_date) : null;
  if (end && end < today) return { text: "Minęło", className: "bg-yellow-100 text-yellow-800" };
  return { text: "Publiczne", className: "bg-green-100 text-green-800" };
};

function sortActiveFirst(items: DashboardItem[]): DashboardItem[] {
  return [...items].sort((a, b) => {
    const aPast = getEventStatus(a).text === "Minęło";
    const bPast = getEventStatus(b).text === "Minęło";
    return aPast === bPast ? 0 : aPast ? 1 : -1;
  });
}

function instructorCompletion(i: InstructorItem): number {
  return Math.round(([i.name, i.short_bio, i.image_id, i.slug].filter(Boolean).length / 4) * 100);
}

function editLink(item: DashboardItem) {
  if (item.kind === "workshop") return `/profile/workshops/${item.id}/edit`;
  if (item.kind === "class") return `/profile/classes/${item.id}/edit`;
  return `/profile/retreats/${item.id}/edit`;
}

function publicLink(item: DashboardItem) {
  if (item.kind === "workshop") return `/wydarzenia/${item.slug}`;
  if (item.kind === "class") return `/zajecia/${item.slug}`;
  return `/wyjazdy/${item.slug}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventCard({
  event,
  onDelete,
  onHide,
  onDuplicate,
  itemToDelete,
  isDeleting,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  event: DashboardItem;
  onDelete: (e: DashboardItem) => void;
  onHide: (e: DashboardItem) => void;
  onDuplicate: (e: DashboardItem) => void;
  itemToDelete: DashboardItem | null;
  isDeleting: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}) {
  const status = getEventStatus(event);
  const isPast = status.text === "Minęło";
  const imageId = event.image_ids?.[0] || event.image_id;

  return (
    <Link
      href={editLink(event)}
      className={cn(
        "border rounded-xl shadow-sm bg-white flex overflow-hidden hover:shadow-md transition-shadow",
        isPast && "opacity-60",
      )}
    >
      {imageId && (
        <WyImage
          src={imageId}
          alt={event.title}
          width={88}
          height={88}
          className="object-cover w-[88px] shrink-0"
        />
      )}
      <div className="p-3 flex flex-col justify-between w-full min-w-0">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-md", status.className)}>
              {status.text}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 bg-gray-100 hover:bg-gray-200"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={editLink(event)}>Edytuj</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(event)} className="cursor-pointer">
                  Duplikuj
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={publicLink(event)} target="_blank" rel="noopener noreferrer">
                    Zobacz stronę publiczną
                  </Link>
                </DropdownMenuItem>
                {event.is_public && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onHide(event);
                    }}
                    className="cursor-pointer"
                  >
                    Ukryj
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(event)}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  Usuń
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 truncate">{event.title}</h3>
          {event.start_date && (
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">
                {formatDateRange(event.start_date, event.end_date)}
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <img
            src={
              event.kind === "retreat"
                ? "/images/logo/logo-retreats.png"
                : "/images/logo/logo-workshops.png"
            }
            className="w-4 h-4"
            alt=""
          />
        </div>
      </div>

      {itemToDelete?.id === event.id && (
        <AlertDialog open onOpenChange={(open) => !open && onDeleteCancel()}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
              <AlertDialogDescription>
                Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie &quot;
                <strong>{event.title}</strong>&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={onDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Usuwanie..." : "Tak, usuń"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfertaPage() {
  const [retreats, setRetreats] = useState<DashboardItem[]>([]);
  const [workshops, setWorkshops] = useState<DashboardItem[]>([]);
  const [classes, setClasses] = useState<DashboardItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DashboardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const areClassesEnabled = useFeatureFlag(FEATURE_FLAGS.classes);

  const requestedFilter = searchParams.get("filter") ?? "all";
  const activeFilter: FilterType = isOfertaFilterEnabled(requestedFilter, areClassesEnabled)
    ? requestedFilter
    : "all";

  const setFilter = (f: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (f === "all") {
      params.delete("filter");
    } else {
      params.set("filter", f);
    }
    router.replace(`/profile/oferta?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Show welcome banner for new users until first content is created
  useEffect(() => {
    const done = localStorage.getItem("wy_onboarding_done") === "true";
    if (!done) setShowBanner(true);
  }, []);

  // Auto-dismiss banner once any content exists
  useEffect(() => {
    if (loadingItems || loadingInstructors || !showBanner) return;
    const hasContent =
      retreats.length > 0 || workshops.length > 0 || classes.length > 0 || instructors.length > 0;
    if (hasContent) {
      localStorage.setItem("wy_onboarding_done", "true");
      setShowBanner(false);
    }
  }, [
    loadingItems,
    loadingInstructors,
    retreats.length,
    workshops.length,
    classes.length,
    instructors.length,
    showBanner,
  ]);

  // Open create dialog when ?create=true is pushed from DashboardTopBar
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsCreateOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("create");
      const qs = params.toString();
      router.replace(`/profile/oferta${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [searchParams, router]);

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
      areClassesEnabled
        ? axiosInstance
            .get<BaseEvent[]>("/classes")
            .then((r) => r.data.map((e) => ({ ...e, kind: "class" as const })))
            .catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([r, w, c]) => {
        setRetreats(sortActiveFirst(r));
        setWorkshops(sortActiveFirst(w));
        setClasses(sortActiveFirst(c));
      })
      .finally(() => setLoadingItems(false));
  }, [areClassesEnabled]);

  // Fetch instructors
  useEffect(() => {
    axiosInstance
      .get<InstructorItem[]>("/instructors")
      .then(({ data }) => setInstructors(data))
      .catch(() => setInstructors([]))
      .finally(() => setLoadingInstructors(false));
  }, []);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const ep =
        itemToDelete.kind === "workshop"
          ? "/workshops"
          : itemToDelete.kind === "class"
            ? "/classes"
            : "/retreats";
      await axiosInstance.delete(`${ep}/${itemToDelete.id}`);
      toast({ description: "Usunięto pomyślnie!" });
      if (itemToDelete.kind === "retreat")
        setRetreats((p) => p.filter((i) => i.id !== itemToDelete.id));
      else if (itemToDelete.kind === "workshop")
        setWorkshops((p) => p.filter((i) => i.id !== itemToDelete.id));
      else setClasses((p) => p.filter((i) => i.id !== itemToDelete.id));
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
          : event.kind === "class"
            ? "/classes"
            : "/retreats";
      await axiosInstance.patch(`${ep}/${event.id}`, { is_public: false });
      toast({ description: "Ukryto pomyślnie!" });
      const updater = (p: DashboardItem[]) =>
        p.map((i) => (i.id === event.id ? { ...i, is_public: false } : i));
      if (event.kind === "retreat") setRetreats(updater);
      else if (event.kind === "workshop") setWorkshops(updater);
      else setClasses(updater);
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
          : event.kind === "class"
            ? "/classes"
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
      if (event.kind === "retreat") {
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
          ? "/profile/workshops/create?duplicate=true"
          : event.kind === "class"
            ? "/profile/classes/create?duplicate=true"
            : "/profile/retreats/create?duplicate=true";
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

  // ── Filtered single-type views ────────────────────────────────────────────

  if (!isLoading && activeFilter !== "all") {
    const viewConfig = getOfertaSingleTypeViewConfig(
      activeFilter,
      { retreats, workshops, classes },
      areClassesEnabled,
    );

    if (!viewConfig) {
      return null;
    }

    const { items, createPath, emptyLabel, countLabel } = viewConfig;

    return (
      <>
        <FilterBar active={activeFilter} includeClasses={areClassesEnabled} onSelect={setFilter} />
        <div className="max-w-2xl mx-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <p className="text-sm text-gray-500">Nie masz jeszcze żadnych {emptyLabel}</p>
              <Link href={createPath} className="text-sm text-gray-400 hover:text-gray-600">
                Dodaj →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((event) => (
                <EventCard key={event.id} event={event} {...cardProps} />
              ))}
              <p className="text-xs text-gray-400 text-center pt-2">{countLabel}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── "Wszystkie" view ──────────────────────────────────────────────────────

  return (
    <>
      <FilterBar active={activeFilter} includeClasses={areClassesEnabled} onSelect={setFilter} />

      {/* "Co chcesz dodać?" modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Co chcesz dodać?</DialogTitle>
            <DialogDescription>Wybierz typ ogłoszenia.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/profile/retreats/create"
                onClick={() => setIsCreateOpen(false)}
                className="border rounded-xl p-6 hover:shadow-md transition bg-white flex flex-col items-center text-center"
              >
                <img src="/images/logo/logo-retreats.png" className="w-16 h-16" alt="" />
                <div className="mt-3 text-base font-semibold">Wyjazd</div>
              </Link>
              <Link
                href="/profile/workshops/create"
                onClick={() => setIsCreateOpen(false)}
                className="border rounded-xl p-6 hover:shadow-md transition bg-white flex flex-col items-center text-center"
              >
                <img src="/images/logo/logo-workshops.png" className="w-16 h-16" alt="" />
                <div className="mt-3 text-base font-semibold">Wydarzenie</div>
              </Link>
            </div>
            <Link
              href="/profile/instructors/create"
              onClick={() => setIsCreateOpen(false)}
              className="border rounded-xl p-4 hover:shadow-md transition bg-white flex items-center gap-4"
            >
              <span className="text-3xl leading-none" aria-hidden="true">
                🧘
              </span>
              <div>
                <p className="text-base font-semibold text-gray-900">Profil Instruktora</p>
                <p className="text-sm text-gray-500 mt-0.5">Dodaj instruktora do swojego konta</p>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {showBanner && <WelcomeBanner onAddEvent={() => setIsCreateOpen(true)} />}
          {/* Wyjazdy */}
          <EventSection
            title="Wyjazdy"
            emptyText="Brak wyjazdów"
            items={retreats.slice(0, 2)}
            totalCount={retreats.length}
            onShowAll={() => setFilter("wyjazdy")}
            createPath="/profile/retreats/create"
            createLabel="Dodaj wyjazd"
            cardProps={cardProps}
          />

          {/* Wydarzenia */}
          <EventSection
            title="Wydarzenia"
            emptyText="Brak wydarzeń"
            items={workshops.slice(0, 2)}
            totalCount={workshops.length}
            onShowAll={() => setFilter("wydarzenia")}
            createPath="/profile/workshops/create"
            createLabel="Dodaj wydarzenie"
            cardProps={cardProps}
          />

          {/* Kursy */}
          {areClassesEnabled && (
            <EventSection
              title="Zajęcia"
              emptyText="Brak zajęć"
              items={classes.slice(0, 2)}
              totalCount={classes.length}
              onShowAll={() => setFilter("zajecia")}
              createPath="/profile/classes/create"
              createLabel="Dodaj zajęcia"
              cardProps={cardProps}
            />
          )}

          {/* Instruktorzy */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Instruktorzy
            </h2>
            {loadingInstructors ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {instructors.length === 0 ? (
                  <div className="rounded-xl border bg-white px-4 py-4 text-sm text-gray-400">
                    Nie masz jeszcze żadnych instruktorów
                  </div>
                ) : (
                  instructors.map((instructor) => {
                    const pct = instructorCompletion(instructor);
                    const styleNames = instructor.yoga_styles
                      .map((s) => s.yoga_style?.name)
                      .join(" · ");
                    console.log(
                      "🚀 ~ OfertaPage ~ instructor.yoga_styles:",
                      instructor.yoga_styles,
                    );

                    const initials = instructor.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={instructor.id}
                        className="rounded-xl border bg-white overflow-hidden"
                      >
                        {/* Info row */}
                        <div className="flex items-center gap-3 px-4 py-4">
                          {instructor.image_id ? (
                            <WyImage
                              src={instructor.image_id}
                              alt={instructor.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover shrink-0 h-12 w-12"
                            />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {initials}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {instructor.name}
                            </p>
                            {(styleNames || instructor.short_bio) && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {styleNames || instructor.short_bio}
                              </p>
                            )}
                          </div>
                          {pct < 100 && (
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Profil {pct}%
                            </span>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div className="flex border-t divide-x">
                          <Link
                            href={`/profile/instructors/${instructor.id}/edit`}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil size={14} className="text-gray-500" />
                            Edytuj profil
                          </Link>
                          {instructor.slug ? (
                            <a
                              href={`/instruktor/${instructor.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ExternalLink size={14} className="text-gray-500" />
                              Strona publiczna
                            </a>
                          ) : (
                            <span className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm text-gray-300 cursor-not-allowed">
                              <ExternalLink size={14} />
                              Strona publiczna
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <Link
                  href="/profile/instructors/create"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Dodaj instruktora</span>
                </Link>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

// ─── WelcomeBanner ───────────────────────────────────────────────────────────

function WelcomeBanner({ onAddEvent }: { onAddEvent: () => void }) {
  return (
    <div className="mx-0 rounded-xl bg-green-50 border border-green-200 p-4 space-y-3">
      <div>
        <p className="text-base font-semibold text-gray-900">Witaj na joga.yoga! 🎉</p>
        <p className="text-sm text-gray-600 mt-1">
          Zacznij od dodania swojego pierwszego wydarzenia lub profilu instruktora.
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onAddEvent} className="flex-1 text-xs">
          + Dodaj wydarzenie
        </Button>
        <Button size="sm" variant="outline" asChild className="flex-1 text-xs">
          <Link href="/profile/instructors/create">+ Dodaj instruktora</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

function FilterBar({
  active,
  includeClasses,
  onSelect,
}: {
  active: FilterType;
  includeClasses: boolean;
  onSelect: (f: FilterType) => void;
}) {
  return (
    <div className="sticky top-16 md:top-20 z-20 bg-background border-b">
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none">
        {getOfertaFilterPills(includeClasses).map(({ key, label, logo }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-colors",
              active === key
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            )}
          >
            {logo && <img src={logo} className="w-4 h-4" alt="" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── EventSection (Wszystkie view) ────────────────────────────────────────────

function EventSection({
  title,
  emptyText,
  items,
  totalCount,
  onShowAll,
  createPath,
  createLabel,
  cardProps,
}: {
  title: string;
  emptyText: string;
  items: DashboardItem[];
  totalCount: number;
  onShowAll: () => void;
  createPath: string;
  createLabel: string;
  cardProps: object;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-gray-50 py-5 px-4 text-center">
          <p className="text-sm text-gray-400">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((event) => (
            <EventCard key={event.id} event={event} {...(cardProps as any)} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-0.5">
        <button
          onClick={onShowAll}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Zobacz wszystkie ({totalCount}) →
        </button>
        <Link
          href={createPath}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Plus size={14} />
          {createLabel}
        </Link>
      </div>
    </section>
  );
}
