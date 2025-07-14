import { Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import React from "react";
import { Control, useController } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SingleImageUploadProps {
  name: string;
  control: Control<any>;
  existingImageId?: string | null;
  imagePreviewUrl?: string | null;
  isUploading: boolean;
  onRemove: () => void;
  disabled?: boolean;
  isRemoved?: boolean;
  onFileSelect?: (file: File) => void;
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
  const { field } = useController({ name, control });

  const existingImageUrl =
    !isRemoved && existingImageId
      ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_128,h_128,c_fill/${existingImageId}`
      : null;

  const currentPreviewUrl = imagePreviewUrl || existingImageUrl;
  const inputId = `file-input-${name}`;

  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32 group">
      {currentPreviewUrl ? (
        <>
          <label htmlFor={inputId} className="cursor-pointer">
            <div className="relative w-24 h-24 md:w-32 md:h-32 border rounded-md overflow-hidden">
              <Image src={currentPreviewUrl} alt="Preview" fill style={{ objectFit: "cover" }} />
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

      <Input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          field.onChange(e.target.files);
          if (onFileSelect && e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
          }
        }}
        disabled={isUploading || disabled}
        ref={field.ref}
      />
    </div>
  );
};
