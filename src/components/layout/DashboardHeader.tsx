import React from "react";

import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  onCreate?: () => void; // Function to call when Create is clicked
  onUpdate?: () => void; // Function to call when Update is clicked
  createLabel?: string; // Optional custom label for Create button
  updateLabel?: string; // Optional custom label for Update button
  children?: React.ReactNode; // Optional slot for extra elements like breadcrumbs or filters
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  onCreate,
  onUpdate,
  createLabel = "Create New",
  updateLabel = "Update",
  children,
}) => {
  return (
    <div className="sticky top-[65px] z-10 bg-background py-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {/* You can place breadcrumbs or subtitle here using children prop if needed */}
        {children}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onCreate && (
          <Button variant="default" onClick={onCreate}>
            {createLabel}
          </Button>
        )}
        {onUpdate && (
          <Button variant="default" onClick={onUpdate}>
            {updateLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
