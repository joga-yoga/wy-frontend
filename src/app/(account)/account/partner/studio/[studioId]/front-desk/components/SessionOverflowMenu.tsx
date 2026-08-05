"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { recurrenceLabel } from "../../../../schedule/recurrenceLabel";

/**
 * The session screen's overflow menu (spec §7), owner-only — the caller gates that. Absorbs
 * the deleted `SessionPanel`'s three action rows and its recurrence pill (now a non-interactive
 * label at the top of the menu instead of a separate pill). All three actions still enter the
 * existing scope → preview → commit pipeline unchanged.
 *
 * `Zobacz stronę publiczną` is deliberately omitted — verified in T03's research: no public
 * per-session URL exists yet.
 */
export function SessionOverflowMenu({
  occurrenceId,
  recurrenceFrequency,
  recurrenceDays,
}: {
  occurrenceId: string;
  recurrenceFrequency: string | null | undefined;
  recurrenceDays: string[] | undefined;
}) {
  const recurrence = recurrenceLabel(recurrenceFrequency, recurrenceDays);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Więcej akcji"
          className="h-9 w-9 shrink-0 p-0 text-gray-500 hover:bg-gray-100"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {recurrence && (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-gray-500">
              {recurrence}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/konto/partner/grafik/edit/${occurrenceId}`}>Edytuj sesję</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/konto/partner/grafik/edit/${occurrenceId}?field=instructor`}>
            Zmień prowadzącego
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-b2b-red-solid focus:bg-b2b-red-bg focus:text-b2b-red-solid"
        >
          <Link href={`/konto/partner/grafik/cancel/${occurrenceId}`}>Odwołaj sesję</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
