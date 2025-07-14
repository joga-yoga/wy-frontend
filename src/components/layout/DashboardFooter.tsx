import Link from "next/link"; // Import Link
import React from "react";

import { Button } from "@/components/ui/button";

interface DashboardFooterProps {
  title: string;
  onCreate?: () => void; // Function to call when Create is clicked
  onUpdate?: () => void; // Function to call when Update is clicked
  createLabel?: string; // Optional custom label for Create button
  createIcon?: React.ReactNode; // Optional icon for Create button
  updateLabel?: string; // Optional custom label for Update button
  updateIcon?: React.ReactNode; // Optional icon for Update button
  viewPublicHref?: string; // New prop for the link href
  viewPublicLabel?: string; // Optional label for the new button
  viewPublicIcon?: React.ReactNode; // Optional icon for View Public button
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
  createIcon,
  updateLabel = "Update",
  updateIcon,
  viewPublicHref,
  viewPublicLabel = "View Public Page", // Default label
  viewPublicIcon,
  children,
  showPublishButton,
  isPublished,
  isPublishing,
  onPublishToggle,
  publishButtonLabel = "Opublikuj wyjazd",
  unpublishButtonLabel = "Ukryj wyjazd",
  publishingButtonLabel = "Zmieniam...",
  publishIcon,
  unpublishIcon,
  publishingIcon,
}) => {
  return (
    <div>
      <div className="h-[64px]" />
      <div className="fixed bottom-0 left-0 right-0 z-10 h-[64px] bg-background border-t flex flex-row justify-between items-center gap-0 md:gap-4 px-6 md:left-[81px]">
        <div>
          <h1 className="hidden text-lg font-bold text-gray-900 md:block">{title}</h1>
          {/* You can place breadcrumbs or subtitle here using children prop if needed */}
          {children}
        </div>
        <div className="flex w-full flex-row items-center gap-2 md:w-auto">
          {/* Use items-center for alignment */}
          {/* Render Create button if handler exists */}
          {onCreate && (
            <Button
              variant="default"
              onClick={onCreate}
              className="flex-1 w-full md:w-auto md:flex-none"
            >
              {createIcon}
              <span className="hidden ml-2 md:inline-block">{createLabel}</span>
            </Button>
          )}
          {/* Render View Public button if href exists */}
          {viewPublicHref && (
            <Link
              href={viewPublicHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 w-full md:w-auto md:flex-none"
            >
              <Button variant="outline" className="w-full">
                {viewPublicIcon}
                <span className="hidden ml-2 md:inline-block">{viewPublicLabel}</span>
              </Button>
            </Link>
          )}
          {/* Render Publish/Unpublish button */}
          {showPublishButton && onPublishToggle && (
            <Button
              variant={isPublished ? "destructive" : "default"}
              onClick={onPublishToggle}
              disabled={isPublishing}
              className="flex-1 w-full md:w-auto md:flex-none"
            >
              {isPublishing ? publishingIcon : isPublished ? unpublishIcon : publishIcon}
              <span className="hidden ml-2 md:inline-block">
                {isPublishing
                  ? publishingButtonLabel
                  : isPublished
                    ? unpublishButtonLabel
                    : publishButtonLabel}
              </span>
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
              className="flex-1 w-full md:w-auto md:flex-none"
            >
              {updateIcon}
              <span className="hidden ml-2 md:inline-block">{updateLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
