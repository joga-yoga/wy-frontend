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
  isSaveDisabled?: boolean;
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
  isSaveDisabled,
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
              <span className="inline-flex items-center">
                {createIcon}
                <span className="ml-2 hidden md:block">{createLabel}</span>
                <span className="ml-2 block md:hidden">{createLabelShort}</span>
              </span>
            </Button>
          )}
          {/* Render View Public button if href exists */}
          {isPublished && viewPublicHref && (
            <Link
              href={viewPublicHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto md:flex-none"
            >
              <Button variant="outline" className="w-full">
                <span className="inline-flex items-center">
                  {viewPublicIcon}
                  <span className="ml-2 hidden md:block">{viewPublicLabel}</span>
                  <span className="ml-2 block md:hidden">{viewPublicLabelShort}</span>
                </span>
              </Button>
            </Link>
          )}
          {/* Render Publish button only if not published */}
          {showPublishButton && onPublishToggle && !isPublished && (
            <Button
              variant="outline"
              onClick={onPublishToggle}
              disabled={isPublishing}
              className="w-full md:w-auto md:flex-none border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <span className="inline-flex items-center">
                {isPublishing ? publishingIcon : publishIcon}
                <span className="ml-2 hidden md:block">
                  {isPublishing ? publishingButtonLabel : publishButtonLabel}
                </span>
                <span className="ml-2 block md:hidden">
                  {isPublishing ? publishingButtonLabelShort : publishButtonLabelShort}
                </span>
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
              disabled={isSaveDisabled || isPublishing}
              className={`w-full md:w-auto md:flex-none transition-all duration-300 ${
                !isSaveDisabled ? "shadow-lg shadow-indigo-500/20" : ""
              }`}
            >
              <span className="inline-flex items-center">
                {updateIcon}
                <span className="ml-2 hidden md:block">{updateLabel}</span>
                <span className="ml-2 block md:hidden">{updateLabelShort}</span>
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
