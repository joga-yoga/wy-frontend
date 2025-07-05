import React from "react";

import { EventDetail } from "../types";

interface CancellationPolicySectionProps {
  event: EventDetail;
  id?: string;
}

export const CancellationPolicySection: React.FC<CancellationPolicySectionProps> = ({
  event,
  id,
}) => {
  if (!event.cancellation_policy) {
    return null;
  }

  return (
    <div className="p-5 border border-gray-100 rounded-[22px] text-center" id={id}>
      <h3 className="text-m-header md:text-subheader text-gray-800">
        Zasady anulowania rezerwacji
      </h3>
      <p className="text-m-descript md:text-sub-descript-18 text-gray-500 text-left mt-3">
        {event.cancellation_policy}
      </p>
    </div>
  );
};
