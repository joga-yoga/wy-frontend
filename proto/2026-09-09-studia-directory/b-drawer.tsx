"use client";

import { krakowStudios } from "@/fixtures";

import { ManageDrawer } from "./a-city";

/**
 * Ten sam ekran, tylko z otwartą szufladą — stan, nie alternatywa.
 *
 * Wiersz bez strony jest tu punktem wejścia do przejęcia profilu, więc szuflada musi działać
 * także dla studia, które nie ma własnej strony. Wybrane studio to celowo takie bez opisu.
 */
const studio = krakowStudios.find((s) => !s.slug) ?? krakowStudios[0];

export default function ManageDrawerState() {
  return (
    <div className="min-h-[560px] p-4">
      <p className="text-m-sunscript-font text-gray-500">Szuflada „Zarządzaj” — {studio.name}</p>
      <ManageDrawer studio={studio} onOpenChange={() => {}} />
    </div>
  );
}
