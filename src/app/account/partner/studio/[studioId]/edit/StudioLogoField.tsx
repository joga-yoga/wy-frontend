"use client";

import { Loader2 } from "lucide-react";
import { useRef } from "react";

import { StudioLogoTile } from "@/components/b2b/StudioLogoTile";

/**
 * The logo row from V1: a small square tile with "Zmień logo" beside it.
 *
 * Replaces a full-width `SingleImageUpload` dropzone. A dropzone is right when the image
 * is the point of the screen; here it is one field among a dozen, and it was taking the
 * vertical space of four of them. The tile also previews the logo at roughly the size it
 * is actually used at in the Menu and on listings.
 *
 * The helper line V1 omits is kept: the drawing cannot say *where* the logo appears, and
 * that is the only thing about it a studio owner needs told.
 */
export function StudioLogoField({
  studioName,
  imageId,
  previewUrl,
  isUploading,
  onFileSelect,
  onRemove,
}: {
  studioName: string;
  imageId: string | null;
  previewUrl: string | null;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLogo = Boolean(imageId || previewUrl);

  return (
    <div>
      <label className="mb-1 block text-base font-semibold">Logo</label>
      <p className="mb-3 text-sm text-muted-foreground">
        Wyświetlane na stronie studia, w wynikach wyszukiwania i na listach zajęć
      </p>

      <div className="flex items-center gap-4">
        <div className="relative">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-14 w-14 rounded-b2b border bg-white object-contain"
            />
          ) : (
            <StudioLogoTile name={studioName || "Studio"} imageId={imageId} size={56} />
          )}
          {isUploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="text-sm font-semibold text-b2b-green-text hover:underline disabled:opacity-50"
          >
            {hasLogo ? "Zmień logo" : "Dodaj logo"}
          </button>
          {hasLogo && (
            <button
              type="button"
              onClick={onRemove}
              disabled={isUploading}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              Usuń
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          // Reset so re-picking the same file still fires onChange.
          e.target.value = "";
        }}
      />
    </div>
  );
}
