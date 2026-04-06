"use client";

import Link from "next/link";
import React from "react";

import { Event } from "@/app/retreats/types";

import { WorkshopCard } from "../../workshops/WorkshopCard";

interface ClassesListProps {
  initialEvents: Event[];
  initialTotal: number;
}

const ClassesList: React.FC<ClassesListProps> = ({ initialEvents }) => {
  if (initialEvents.length === 0) {
    return <p className="text-center py-10 text-gray-500">Nie znaleziono zajęć.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
      {initialEvents.map((event) => (
        <Link key={event.id} href={`/classes/${event.slug}`} passHref>
          <WorkshopCard event={event} />
        </Link>
      ))}
    </div>
  );
};

export default ClassesList;
