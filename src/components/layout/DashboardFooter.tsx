import Link from "next/link"; // Import Link
import React from "react";

import { Button } from "@/components/ui/button";

interface DashboardFooterProps {
  title: string;
  onCreate?: () => void; // Function to call when Create is clicked
  onUpdate?: () => void; // Function to call when Update is clicked
  createLabel?: string; // Optional custom label for Create button
  updateLabel?: string; // Optional custom label for Update button
  updateIcon?: React.ReactNode; // Optional icon for Update button
  viewPublicHref?: string; // New prop for the link href
  viewPublicLabel?: string; // Optional label for the new button
  children?: React.ReactNode; // Optional slot for extra elements like breadcrumbs or filters
  // Props for the Publish/Unpublish button
  showPublishButton?: boolean;
  isPublished?: boolean;
  isPublishing?: boolean;
  onPublishToggle?: () => void;
  publishButtonLabel?: string;
  unpublishButtonLabel?: string;
  publishingButtonLabel?: string;
  publishIcon?: React.ReactNode;
  unpublishIcon?: React.ReactNode;
  publishingIcon?: React.ReactNode;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  title,
  onCreate,
  onUpdate,
  createLabel = "Create New",
  updateLabel = "Update",
  updateIcon,
  viewPublicHref,
  viewPublicLabel = "View Public Page", // Default label
  children,
  showPublishButton,
  isPublished,
  isPublishing,
  onPublishToggle,
  publishButtonLabel = "Opublikuj wydarzenie",
  unpublishButtonLabel = "Ukryj wydarzenie",
  publishingButtonLabel = "Zmieniam...",
  publishIcon,
  unpublishIcon,
  publishingIcon,
}) => {
  return (
    <div>
      <div className="h-[64px]" />
      <div className="fixed bottom-0 left-[81px] right-0 z-10 h-[64px] bg-background py-3 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {/* You can place breadcrumbs or subtitle here using children prop if needed */}
          {children}
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          {/* Use items-center for alignment */}
          {/* Render Create button if handler exists */}
          {onCreate && (
            <Button variant="default" onClick={onCreate}>
              {createLabel}
            </Button>
          )}
          {/* Render View Public button if href exists */}
          {viewPublicHref && (
            <Link href={viewPublicHref} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">{viewPublicLabel}</Button>
            </Link>
          )}
          {/* Render Publish/Unpublish button */}
          {showPublishButton && onPublishToggle && (
            <Button
              variant={isPublished ? "destructive" : "default"}
              onClick={onPublishToggle}
              disabled={isPublishing}
            >
              {isPublishing
                ? publishingButtonLabel
                : isPublished
                  ? unpublishButtonLabel
                  : publishButtonLabel}
              {isPublishing ? publishingIcon : isPublished ? unpublishIcon : publishIcon}
            </Button>
          )}
          {/* Render Update button if handler exists */}
          {onUpdate && (
            <Button
              variant="default"
              onClick={() => {
                onUpdate();
              }}
              disabled={isPublishing} // Assuming isPublishing also means other actions might be blocked or it's a general loading state
            >
              {updateLabel}
              {updateIcon}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
