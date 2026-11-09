import { Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import React, { useId } from "react";
import { Control, useController } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { WyImage } from "../custom/WyImage";

interface SingleImageUploadBaseProps {
  existingImageId?: string | null;
  imagePreviewUrl?: string | null;
  isUploading: boolean;
  onRemove: () => void;
  disabled?: boolean;
  isRemoved?: boolean;
  onFileSelect?: (file: File) => void;
  previewClassName?: string;
  /** Styles the empty drop target. R4 draws a circular avatar well, not a square one. */
  placeholderClassName?: string;
  /** Optional local artwork inside the empty upload target; never a stored image. */
  placeholderContent?: React.ReactNode;
  variant?: "default" | "avatar";
}

interface ControlledSingleImageUploadProps extends SingleImageUploadBaseProps {
  name: string;
  control: Control<any>;
}

interface StandaloneSingleImageUploadProps extends SingleImageUploadBaseProps {
  name?: never;
  control?: never;
}

type SingleImageUploadProps = ControlledSingleImageUploadProps | StandaloneSingleImageUploadProps;

function ControlledFileInput({
  name,
  control,
  inputId,
  isUploading,
  disabled,
  onFileSelect,
}: {
  name: string;
  control: Control<any>;
  inputId: string;
  isUploading: boolean;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
}) {
  const { field } = useController({ name, control });
  return (
    <Input
      id={inputId}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        field.onChange(e.target.files);
        if (onFileSelect && e.target.files?.[0]) {
          onFileSelect(e.target.files[0]);
        }
      }}
      disabled={isUploading || disabled}
      ref={field.ref}
    />
  );
}

function StandaloneFileInput({
  inputId,
  isUploading,
  disabled,
  onFileSelect,
}: {
  inputId: string;
  isUploading: boolean;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
}) {
  return (
    <Input
      id={inputId}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        if (onFileSelect && e.target.files?.[0]) {
          onFileSelect(e.target.files[0]);
        }
      }}
      disabled={isUploading || disabled}
    />
  );
}

export const SingleImageUpload = ({
  name,
  control,
  existingImageId,
  imagePreviewUrl,
  isUploading,
  onRemove,
  disabled,
  isRemoved,
  onFileSelect,
  previewClassName,
  placeholderClassName,
  placeholderContent,
  variant = "default",
}: SingleImageUploadProps) => {
  const existingImageUrl =
    !isRemoved && existingImageId
      ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${existingImageId}`
      : null;

  const currentPreviewUrl = imagePreviewUrl || existingImageUrl;
  const generatedId = useId();
  const inputId = `file-input-${name ?? generatedId}`;
  const isAvatar = variant === "avatar";
  const PreviewImage = isAvatar ? Image : WyImage;
  const isDisabled = isUploading || disabled;
  const avatarTriggerProps = isAvatar
    ? {
        role: "button" as const,
        tabIndex: isDisabled ? -1 : 0,
        "aria-label": currentPreviewUrl ? "Zmień zdjęcie" : "Dodaj zdjęcie",
        "aria-disabled": Boolean(isDisabled),
        onKeyDown: (event: React.KeyboardEvent<HTMLLabelElement>) => {
          if (!isDisabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            document.getElementById(inputId)?.click();
          }
        },
      }
    : {};

  return (
    <div
      className={cn(
        "relative w-24 h-24 md:w-32 md:h-32 group",
        isAvatar && "h-32 w-32 max-w-full md:h-40 md:w-40",
      )}
    >
      {currentPreviewUrl ? (
        <>
          <label
            htmlFor={inputId}
            {...avatarTriggerProps}
            className={cn(
              "cursor-pointer",
              isAvatar &&
                "block h-full w-full rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
            )}
          >
            <div
              className={cn(
                "relative w-24 h-24 md:w-32 md:h-32 border rounded-md overflow-hidden justify-center items-center flex",
                isAvatar && "h-full w-full rounded-full md:h-full md:w-full",
              )}
            >
              <PreviewImage
                src={currentPreviewUrl}
                alt={isAvatar ? "Podgląd zdjęcia profilowego" : "Preview"}
                className={cn("object-cover", isAvatar && "object-center", previewClassName)}
                fill={isAvatar}
                height={isAvatar ? undefined : "128"}
                width={isAvatar ? undefined : "128"}
                sizes={isAvatar ? "(min-width: 768px) 160px, 128px" : undefined}
                unoptimized={isAvatar || undefined}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
          </label>
          {!isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className={cn(
                "absolute top-1 right-1 z-10 h-auto p-1 opacity-100 transition-opacity group-hover:opacity-100 md:opacity-0",
                isAvatar && "h-11 w-11 rounded-full p-2 md:opacity-100",
              )}
              onClick={onRemove}
              disabled={disabled}
              aria-label="Usuń zdjęcie"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </>
      ) : (
        <label
          htmlFor={inputId}
          {...avatarTriggerProps}
          className={cn(
            "w-24 h-24 md:w-32 md:h-32 rounded border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors",
            placeholderClassName,
            isAvatar &&
              "h-full w-full rounded-full md:h-full md:w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              {placeholderContent ?? <Plus className="h-8 w-8" />}
              <span className="mt-2 text-sm text-center">Dodaj zdjęcie</span>
            </>
          )}
        </label>
      )}

      {control && name ? (
        <ControlledFileInput
          name={name}
          control={control}
          inputId={inputId}
          isUploading={isUploading}
          disabled={disabled}
          onFileSelect={onFileSelect}
        />
      ) : (
        <StandaloneFileInput
          inputId={inputId}
          isUploading={isUploading}
          disabled={disabled}
          onFileSelect={onFileSelect}
        />
      )}
    </div>
  );
};
