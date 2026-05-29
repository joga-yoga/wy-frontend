import { Loader2, Plus, Trash2 } from "lucide-react";
import React, { useId } from "react";
import { Control, useController } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { WyImage } from "../custom/WyImage";

interface SingleImageUploadBaseProps {
  existingImageId?: string | null;
  imagePreviewUrl?: string | null;
  isUploading: boolean;
  onRemove: () => void;
  disabled?: boolean;
  isRemoved?: boolean;
  onFileSelect?: (file: File) => void;
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
}: SingleImageUploadProps) => {
  const existingImageUrl =
    !isRemoved && existingImageId
      ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${existingImageId}`
      : null;

  const currentPreviewUrl = imagePreviewUrl || existingImageUrl;
  const generatedId = useId();
  const inputId = `file-input-${name ?? generatedId}`;

  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32 group">
      {currentPreviewUrl ? (
        <>
          <label htmlFor={inputId} className="cursor-pointer">
            <div className="relative w-24 h-24 md:w-32 md:h-32 border rounded-md overflow-hidden">
              <WyImage
                src={currentPreviewUrl}
                alt="Preview"
                className="object-cover"
                height="128"
                width="128"
                crop="fill"
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
              className="absolute top-1 right-1 z-10 h-auto p-1 opacity-100 transition-opacity group-hover:opacity-100 md:opacity-0"
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
          className="w-24 h-24 md:w-32 md:h-32 rounded border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <Plus className="h-8 w-8" />
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
