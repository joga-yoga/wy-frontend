"use client";

import { Lock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InfoNote } from "@/components/b2b/InfoNote";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useSetPageTitle } from "@/context/PageHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";
import type { InstructorProfile, InstructorPublic } from "@/types/instructor";

import type { StudioRosterDetachResponse, StudioRosterItem, StudioRosterResponse } from "../types";
import { InstructorFullProfileForm } from "./edit/InstructorFullProfileForm";

function formatInviteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export default function RosterInstructorDetailPage() {
  const params = useParams<{ instructorId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { studio } = useCurrentStudio();

  // Editable — the full `InstructorProfile` (owner-gated GET /instructors/{id}).
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  // View-only (claimed by someone else) — only the studio-scoped roster fields plus
  // whatever the instructor has chosen to publish (fetched from the *public* page,
  // never the owner-gated endpoint — this studio does not own that profile).
  const [publicProfile, setPublicProfile] = useState<InstructorPublic | null>(null);
  const [rosterItem, setRosterItem] = useState<StudioRosterItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetaching, setIsDetaching] = useState(false);

  // R5 heads this screen with the instructor's name, not a generic label. Only the
  // screen knows it, so it pushes the title up rather than the header guessing.
  useSetPageTitle(rosterItem?.name ?? null);

  useEffect(() => {
    if (!studio) return;
    setIsLoading(true);
    axiosInstance
      .get<StudioRosterResponse>(`/studios/${studio.id}/roster`)
      .then(({ data }) => {
        const item = data.items.find((i) => i.id === params.instructorId) ?? null;
        setRosterItem(item);
        if (!item) return Promise.resolve();
        if (item.can_edit_profile) {
          return axiosInstance
            .get<InstructorProfile>(`/instructors/${params.instructorId}`)
            .then(({ data: full }) => setInstructor(full));
        }
        if (item.slug) {
          return axiosInstance
            .get<{ instructor: InstructorPublic }>(`/instructor/${item.slug}`)
            .then(({ data: page }) => setPublicProfile(page.instructor))
            .catch(() => undefined);
        }
        return Promise.resolve();
      })
      .catch(() => {
        toast({ description: "Nie udało się wczytać profilu.", variant: "destructive" });
        router.push("/account/partner/instructors");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio, params.instructorId]);

  async function handleDetach() {
    if (!studio) return;
    setIsDetaching(true);
    try {
      const { data } = await axiosInstance.delete<StudioRosterDetachResponse>(
        `/studios/${studio.id}/roster/${params.instructorId}`,
      );
      toast({
        description: data.has_future_sessions
          ? `Odłączono. ${rosterItem?.name ?? "Instruktor"} pozostaje przypisana/y do ${
              data.future_session_count
            } nadchodzących sesji — zmień prowadzącego w Grafiku.`
          : "Odłączono od studia.",
      });
      router.push("/account/partner/instructors");
    } catch {
      toast({ description: "Nie udało się odłączyć instruktora.", variant: "destructive" });
    } finally {
      setIsDetaching(false);
    }
  }

  if (isLoading || !rosterItem) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const canDetach = rosterItem.row_state !== "self";

  // Read-only: this studio cannot edit the profile. Two different reasons reach here —
  // the instructor claimed it (edit rights transferred to them, instructors-clients §4),
  // or another account owns the stub. `claim_status` distinguishes them; `can_edit_profile`
  // only says the door is shut. Rendered from the roster item + the instructor's own
  // public page, since the owner-gated editor endpoint would refuse this studio.
  if (!rosterItem.can_edit_profile) {
    const isClaimed = rosterItem.claim_status === "claimed";
    const imageId = publicProfile?.image_id ?? rosterItem.image_id;
    const yogaStyles = publicProfile?.yoga_styles ?? [];
    return (
      <div className="max-w-md mx-auto px-4 py-5 space-y-5 text-center">
        {imageId ? (
          <WyImage
            src={imageId}
            alt={rosterItem.name}
            width={96}
            height={96}
            className="mx-auto h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold text-gray-500">
            {rosterItem.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-gray-900">{rosterItem.name}</p>
          {yogaStyles.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {yogaStyles.map((s, i) => (
                <Badge key={i} variant="secondary">
                  {s.yoga_style?.name ?? s.custom_name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-b2b border bg-gray-50 px-4 py-3.5 text-left">
          <Lock size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isClaimed ? (
              <>
                Profil {rosterItem.name.split(" ")[0]} jest przejęty i zarządzany samodzielnie.
                Edycja danych leży po stronie instruktora.
              </>
            ) : (
              <>
                Profil {rosterItem.name.split(" ")[0]} prowadzi inne konto — edycja danych nie jest
                tu dostępna. Połączenie ze studiem działa normalnie.
              </>
            )}
          </p>
        </div>

        {rosterItem.slug && (
          <a
            href={`/instruktor/${rosterItem.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-b2b border bg-white px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">Zobacz profil publiczny</span>
            <span className="text-xs text-gray-400">joga.yoga/i/{rosterItem.slug}</span>
          </a>
        )}

        {canDetach && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-sm font-medium text-b2b-red-solid hover:underline">
                Odłącz od studia
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Odłączyć {rosterItem.name} od studia?</AlertDialogTitle>
                <AlertDialogDescription>
                  Profil instruktora zostanie odłączony od tego studia. Instruktor zachowuje swój
                  profil i może zostać dodany ponownie w każdej chwili.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDetach}
                  disabled={isDetaching}
                  className="bg-b2b-red-solid hover:bg-b2b-red-solid/90"
                >
                  Odłącz
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }

  // stub / invited (and self) — full edit via the shared editor. `instructor` is
  // guaranteed to load here since `can_edit_profile` gated the fetch above.
  if (!instructor) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const banner =
    rosterItem.row_state === "awaiting" || rosterItem.row_state === "no_account" ? (
      <InfoNote tone="amber">
        Profil w Twoim zarządzaniu, dopóki {instructor.name.split(" ")[0]} go nie przejmie
        {rosterItem.row_state === "awaiting" ? " z zaproszenia" : ""}.
        {rosterItem.invited_at && (
          <> Zaproszenie wysłano {formatInviteDate(rosterItem.invited_at)}.</>
        )}
      </InfoNote>
    ) : null;

  const detachAction = canDetach ? (
    <div className="px-4 text-center">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className="text-sm font-medium text-b2b-red-solid hover:underline">
            Odłącz od studia
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odłączyć {instructor.name} od studia?</AlertDialogTitle>
            <AlertDialogDescription>
              Profil instruktora zostanie odłączony od tego studia. Instruktor zachowuje swój profil
              i może zostać dodany ponownie w każdej chwili.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDetach}
              disabled={isDetaching}
              className="bg-b2b-red-solid hover:bg-b2b-red-solid/90"
            >
              Odłącz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ) : null;

  // The full editor, not the 4-field cut-down this screen used to render. Certificates,
  // descriptions, gallery, languages, locations and social links were all reachable only
  // from the /edit URL, which nothing linked to.
  return (
    <div className="mx-auto max-w-2xl px-4 py-5 pb-28">
      <InstructorFullProfileForm
        instructorId={instructor.id}
        statusBanner={banner}
        extraActions={detachAction}
      />
    </div>
  );
}
