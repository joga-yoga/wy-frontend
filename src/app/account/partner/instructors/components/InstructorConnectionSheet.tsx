"use client";

import { Clock, Lock, UserRound } from "lucide-react";
import { IoChevronForward } from "react-icons/io5";

import { InfoNote } from "@/components/b2b/InfoNote";
import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
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
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

import { CHIP } from "../rosterChips";
import type { StudioRosterItem } from "../types";

/**
 * The read-only card for an instructor this studio cannot edit (R6).
 *
 * A sheet rather than a pushed screen, because there is nothing here to edit, and pushing
 * a whole screen to say "you can't change this" costs a navigation the information does
 * not earn.
 *
 * **Two different reasons land here, and they must not be conflated.** Either the
 * instructor claimed the profile and edit rights transferred to them, or another account
 * created and still owns the stub. The old copy asserted the first unconditionally, so a
 * row showing amber "Oczekuje" in the list opened onto a green "Połączono" claiming the
 * profile was "przejęty" — of somebody who had never accepted anything. `claim_status` is
 * what actually answers this; `can_edit_profile` only says the door is shut, not why.
 */
export function InstructorConnectionSheet({
  item,
  open,
  onOpenChange,
  onDetach,
  isDetaching,
}: {
  item: StudioRosterItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetach: () => Promise<void>;
  isDetaching: boolean;
}) {
  if (!item) return null;

  const firstName = item.name.split(" ")[0];
  const chip = CHIP[item.row_state];
  const isClaimed = item.claim_status === "claimed";
  const isRejected = item.row_state === "rejected";
  const isAwaiting = item.row_state === "awaiting";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="sm:mx-auto sm:max-w-md">
        <div className="flex items-start gap-3 px-4 pt-2 pb-4">
          <HashedAvatar seed={item.id} name={item.name} imageId={item.image_id} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DrawerTitle className="min-w-0 flex-1 truncate text-base font-bold text-gray-900">
                {item.name}
              </DrawerTitle>
              <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
            </div>
            {/* R6 shows styles here. The roster payload carries a bio, not styles, and
                fetching the public profile to fill one subtitle line would be a request
                per sheet open. The bio says more anyway. */}
            {item.short_bio && (
              <p className="mt-0.5 truncate text-xs text-gray-500">{item.short_bio}</p>
            )}
          </div>
        </div>

        <div className="space-y-3 px-4 pb-6">
          {/* R6 writes "Ania przejęła profil… po jej stronie" — feminine, because the
              mockup happens to draw a woman. The roster carries no gender, so the copy
              is built from a name plus neutral forms, per the vocabulary rule from
              part 1. Guessing from a first name is how you misgender a real user. */}
          {/* A refusal is its own story and must be told before the edit-rights one:
              "Połączenie ze studiem działa normalnie" is plainly false once the other
              side has said no. */}
          {isRejected ? (
            <InfoNote icon={<Lock size={15} />}>
              Zaproszenie do studia zostało odrzucone. Profil pozostaje na liście — możesz wysłać
              zaproszenie ponownie w każdej chwili.
            </InfoNote>
          ) : (
            <>
              {/* Two independent facts, and they were being told as one. Who may edit the
                  profile is the *profile* lifecycle; whether the studio connection is
                  settled is the *link* lifecycle. The old copy asserted "Połączenie ze
                  studiem działa normalnie" unconditionally, which is false while the
                  other side has not answered — the same conflation the roster list made.
                  See `models/studio_instructor.py`: the two machines must not be merged. */}
              <InfoNote icon={<Lock size={15} />}>
                {isClaimed ? (
                  <>
                    Profil {firstName} jest przejęty i zarządzany samodzielnie. Edycja danych leży
                    po stronie instruktora.
                  </>
                ) : (
                  <>Profil {firstName} prowadzi inne konto — edycja danych nie jest tu dostępna.</>
                )}
              </InfoNote>

              {isAwaiting && (
                <InfoNote icon={<Clock size={15} />}>
                  {/* Adjectives agree with "profil"/"studio", never with the person — the
                      roster carries no gender and a first name is not one. */}
                  Zaproszenie do zespołu czeka na akceptację. Profil jest już widoczny w grafiku i
                  na stronie studia; studio pojawi się na profilu publicznym po akceptacji.
                </InfoNote>
              )}
            </>
          )}

          {item.slug && (
            <a
              href={`/instruktor/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-b2b border bg-white px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <UserRound size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  Zobacz profil publiczny
                </span>
                <span className="block truncate text-xs text-gray-500">
                  joga.yoga/i/{item.slug}
                </span>
              </span>
              <IoChevronForward className="h-4 w-4 shrink-0 text-gray-400" />
            </a>
          )}

          {/* Still confirmed. A destructive action inside a sheet is no less destructive. */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isDetaching}
                className="w-full py-2 text-center text-sm font-medium text-b2b-red-solid hover:underline disabled:opacity-50"
              >
                Odłącz od studia
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Odłączyć {item.name} od studia?</AlertDialogTitle>
                <AlertDialogDescription>
                  Profil instruktora zostanie odłączony od tego studia. Instruktor zachowuje swój
                  profil i może zostać dodany ponownie w każdej chwili.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDetach}
                  disabled={isDetaching}
                  className="bg-b2b-red-solid hover:bg-b2b-red-solid/90"
                >
                  Odłącz
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
