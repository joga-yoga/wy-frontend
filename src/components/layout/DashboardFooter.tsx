import Link from "next/link"; // Import Link
import React from "react";

import { Button } from "@/components/ui/button";

interface DashboardFooterProps {
  title: string;
  onCreate?: () => void; // Function to call when Create is clicked
  onUpdate?: () => void; // Function to call when Update is clicked
  createLabel?: string; // Optional custom label for Create button
  createLabelShort?: string;
  createIcon?: React.ReactNode; // Optional icon for Create button
  updateLabel?: string; // Optional custom label for Update button
  updateLabelShort?: string;
  updateIcon?: React.ReactNode; // Optional icon for Update button
  viewPublicHref?: string; // New prop for the link href
  viewPublicLabel?: string; // Optional label for the new button
  viewPublicLabelShort?: string;
  viewPublicIcon?: React.ReactNode; // Optional icon for View Public button
  children?: React.ReactNode; // Optional slot for extra elements like breadcrumbs or filters
  // Props for the Publish/Unpublish button
  showPublishButton?: boolean;
  isPublished?: boolean;
  isPublishing?: boolean;
  onPublishToggle?: () => void;
  publishButtonLabel?: string;
  publishButtonLabelShort?: string;
  unpublishButtonLabel?: string;
  unpublishButtonLabelShort?: string;
  publishingButtonLabel?: string;
  publishingButtonLabelShort?: string;
  publishIcon?: React.ReactNode;
  unpublishIcon?: React.ReactNode;
  publishingIcon?: React.ReactNode;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  title,
  onCreate,
  onUpdate,
  createLabel = "Create New",
  createLabelShort,
  createIcon,
  updateLabel = "Update",
  updateLabelShort,
  updateIcon,
  viewPublicHref,
  viewPublicLabel = "View Public Page", // Default label
  viewPublicLabelShort,
  viewPublicIcon,
  children,
  showPublishButton,
  isPublished,
  isPublishing,
  onPublishToggle,
  publishButtonLabel = "Opublikuj wyjazd",
  publishButtonLabelShort,
  unpublishButtonLabel = "Ukryj wyjazd",
  unpublishButtonLabelShort,
  publishingButtonLabel = "Zmieniam...",
  publishingButtonLabelShort,
  publishIcon,
  unpublishIcon,
  publishingIcon,
}) => {
  return (
    <div>
      <div className="h-[56px] md:h-[64px]" />
      <div className="fixed bottom-0 left-0 right-0 z-10 h-[56px] md:h-[64px] bg-background border-t flex flex-row justify-between items-center gap-0 md:gap-4 px-3 md:px-6 md:left-[81px]">
        <div>
          <h1 className="hidden text-lg font-bold text-gray-900 md:block">{title}</h1>
          {/* You can place breadcrumbs or subtitle here using children prop if needed */}
          {children}
        </div>
        <div className="grid w-full grid-flow-col auto-cols-fr items-center gap-2 md:flex md:w-auto">
          {/* Use items-center for alignment */}
          {/* Render Create button if handler exists */}
          {onCreate && (
            <Button variant="default" onClick={onCreate} className="w-full md:w-auto md:flex-none">
              <span className="hidden md:inline-flex items-center">
                {createIcon}
                <span className="ml-2">{createLabel}</span>
              </span>
              <span className="md:hidden text-sm">{createLabelShort ?? createLabel}</span>
            </Button>
          )}
          {/* Render View Public button if href exists */}
          {viewPublicHref && (
            <Link
              href={viewPublicHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto md:flex-none"
            >
              <Button variant="outline" className="w-full">
                <span className="hidden md:inline-flex items-center">
                  {viewPublicIcon}
                  <span className="ml-2">{viewPublicLabel}</span>
                </span>
                <span className="md:hidden text-sm">{viewPublicLabelShort ?? viewPublicLabel}</span>
              </Button>
            </Link>
          )}
          {/* Render Publish/Unpublish button */}
          {showPublishButton && onPublishToggle && (
            <Button
              variant={isPublished ? "destructive" : "default"}
              onClick={onPublishToggle}
              disabled={isPublishing}
              className="w-full md:w-auto md:flex-none"
            >
              <span className="hidden md:inline-flex items-center">
                {isPublishing ? publishingIcon : isPublished ? unpublishIcon : publishIcon}
                <span className="ml-2">
                  {isPublishing
                    ? publishingButtonLabel
                    : isPublished
                      ? unpublishButtonLabel
                      : publishButtonLabel}
                </span>
              </span>
              <span className="md:hidden text-sm">
                {isPublishing
                  ? (publishingButtonLabelShort ?? publishingButtonLabel)
                  : isPublished
                    ? (unpublishButtonLabelShort ?? unpublishButtonLabel)
                    : (publishButtonLabelShort ?? publishButtonLabel)}
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
              className="w-full md:w-auto md:flex-none"
            >
              <span className="hidden md:inline-flex items-center">
                {updateIcon}
                <span className="ml-2">{updateLabel}</span>
              </span>
              <span className="md:hidden text-sm">{updateLabelShort ?? updateLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
