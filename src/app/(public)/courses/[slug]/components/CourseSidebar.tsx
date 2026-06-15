"use client";

import { CreditCard, Receipt } from "lucide-react";
import React, { useState } from "react";

import { ReservationModal } from "@/app/(public)/retreats/[slug]/components/ReservationModal";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/currency";

import { CourseEventDetail } from "../types";
import { BALANCE_METHOD_SHORT, formatPolishDate } from "../helpers";

interface CourseSidebarProps {
  event: CourseEventDetail;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({ event }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!event.price) return null;

  const currency = getCurrencySymbol(event.currency);
  const hasDates = !!event.start_date;

  return (
    <>
      <div className="sticky top-8 self-start border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
        {/* Price */}
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {event.price.toLocaleString("pl-PL")} {currency}
          </p>
          {event.deposit_amount != null && (
            <p className="text-sm text-gray-500 mt-1">
              zadatek {event.deposit_amount.toLocaleString("pl-PL")} {currency} online
            </p>
          )}
          {event.balance_payment_methods && event.balance_payment_methods.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-500 mt-1.5">
              <Receipt className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
              <span>
                Pozostała kwota:{" "}
                {event.balance_payment_methods
                  .map((m) => BALANCE_METHOD_SHORT[m] ?? m)
                  .join(" lub ")}
              </span>
            </div>
          )}
        </div>

        {/* Dates */}
        {hasDates && (
          <>
            <hr />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Początek</span>
                <span className="text-gray-900 font-medium">
                  {formatPolishDate(event.start_date!)}
                </span>
              </div>
              {event.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Koniec</span>
                  <span className="text-gray-900 font-medium">
                    {formatPolishDate(event.end_date)}
                  </span>
                </div>
              )}
              {event.enrollment_closes && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zapisy do</span>
                  <span className="text-gray-900 font-medium">
                    {formatPolishDate(event.enrollment_closes)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* CTA */}
        <Button
          variant="cta"
          size="cta"
          className="w-full"
          onClick={() => setIsModalOpen(true)}
        >
          Zapisz się
        </Button>

        {/* Payment terms */}
        {event.payment_terms && (
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <CreditCard className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
            <span>{event.payment_terms}</span>
          </div>
        )}
      </div>

      <ReservationModal
        event={event}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        project="workshops"
      />
    </>
  );
};
