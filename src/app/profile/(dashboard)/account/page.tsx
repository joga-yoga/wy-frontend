"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { IoLogOut } from "react-icons/io5";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function avatarInitials(name: string | undefined, email: string | undefined): string {
  const src = name?.trim() || email || "";
  const parts = src.split(/[\s@]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.charAt(0).toUpperCase() || "?";
}

function displayName(name: string | undefined, email: string | undefined): string {
  return name?.trim() || email?.split("@")[0] || "";
}

export default function KontoPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      {/* Identity card */}
      <div className="rounded-xl border bg-white px-4 py-4 flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-base font-semibold text-gray-700">
            {avatarInitials(user?.name, user?.email)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {displayName(user?.name, user?.email)}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Profil partnera */}
      <section className="space-y-1.5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
          Profil partnera
        </h2>
        <div className="rounded-xl border bg-white divide-y overflow-hidden">
          <Link
            href="/profile/partner"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">Dane organizatora</p>
              <p className="text-xs text-gray-500 mt-0.5">Nazwa, kontakt, adres</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 shrink-0" />
          </Link>
          <div className="flex items-center justify-between px-4 py-3.5 opacity-60">
            <div>
              <p className="text-sm font-medium text-gray-900">Dane rozliczeniowe</p>
              <p className="text-xs text-gray-500 mt-0.5">NIP, konto bankowe</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Wkrótce
            </span>
          </div>
        </div>
      </section>

      {/* Przełącz na profil B2C */}
      <section className="space-y-1.5">
        <div className="rounded-xl border bg-white px-4 py-3.5 flex items-center justify-between opacity-60">
          <div>
            <p className="text-sm font-medium text-gray-900">Przełącz profil</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Zmień aktywny profil z organizatora na uczestnika
            </p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Wkrótce
          </span>
        </div>
      </section>

      {/* Wyloguj się */}
      <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 transition-colors"
        >
          <IoLogOut size={18} className="shrink-0" />
          <span className="text-sm font-medium">Wyloguj się</span>
        </button>
      </div>
    </div>
  );
}
