"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function InstructorPhotoGallery({ value, onChange }: Props) {
  const [pendingPreviews, setPendingPreviews] = useState<{ file: File; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [pendingPreviews]);

  const handleRemoveImage = (imageId: string) => {
    onChange(value.filter((id) => id !== imageId));
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const previews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPendingPreviews(previews);
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedIds: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const { data } = await axiosInstance.post<{ image_id: string }>(
          "/instructors/image-upload",
          fd,
        );
        uploadedIds.push(data.image_id);
      }
      onChange([...value, ...uploadedIds]);
    } catch {
      setUploadError("Nie udało się przesłać zdjęcia. Spróbuj ponownie.");
    } finally {
      setPendingPreviews([]);
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {value.map((imageId) => (
          <div key={imageId} className="relative group aspect-[4/3]">
            <WyImage
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_200,h_150/v1/${imageId}`}
              alt="Zdjęcie instruktora"
              fill
              className="rounded-md border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 p-1 h-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveImage(imageId)}
              aria-label="Usuń zdjęcie"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}

        {pendingPreviews.map(({ file, url }, index) => (
          <div
            key={`${file.name}-${index}`}
            className="relative aspect-[4/3] rounded-md border overflow-hidden"
          >
            <Image src={url} alt="Podgląd" fill className="object-cover" onLoad={() => {}} />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          </div>
        ))}

        <label
          htmlFor="instructor-photo-upload"
          className="aspect-[4/3] rounded-md border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Plus className="h-6 w-6" />
              <span className="mt-1 text-xs text-center">
                {value.length > 0 ? "Dodaj kolejne" : "Dodaj zdjęcia"}
              </span>
            </>
          )}
        </label>
        <Input
          id="instructor-photo-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
    </div>
  );
}
