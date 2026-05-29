"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import type { CertificateItem } from "@/types/instructor";

interface Props {
  value: CertificateItem[];
  onChange: (value: CertificateItem[]) => void;
}

export function CertificatesField({ value, onChange }: Props) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  const add = () => onChange([...value, { name: "", image_id: null }]);

  const update = (index: number, patch: Partial<CertificateItem>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    const url = previewUrls[index];
    if (url) URL.revokeObjectURL(url);
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    onChange(value.filter((_, i) => i !== index));
  };

  const handleImageSelect = async (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrls((prev) => ({ ...prev, [index]: previewUrl }));
    setUploadingIndex(index);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await axiosInstance.post<{ image_id: string }>(
        "/instructors/image-upload",
        fd,
      );
      update(index, { image_id: data.image_id });
    } catch {
      // keep the field empty on failure
    } finally {
      setUploadingIndex(null);
      URL.revokeObjectURL(previewUrl);
      setPreviewUrls((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleImageRemove = (index: number) => {
    const url = previewUrls[index];
    if (url) URL.revokeObjectURL(url);
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    update(index, { image_id: null });
  };

  return (
    <div className="space-y-3">
      {value.map((cert, i) => (
        <div key={i} className="rounded-md border p-3 space-y-3">
          <div className="flex items-start gap-3">
            <SingleImageUpload
              existingImageId={cert.image_id}
              imagePreviewUrl={previewUrls[i] ?? null}
              isUploading={uploadingIndex === i}
              onRemove={() => handleImageRemove(i)}
              onFileSelect={(file) => handleImageSelect(i, file)}
            />
            <div className="flex-1 space-y-2 pt-1">
              <Input
                placeholder="Nazwa certyfikatu"
                value={cert.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(i)}
              className="text-destructive hover:text-destructive shrink-0"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1" /> Dodaj certyfikat
      </Button>
    </div>
  );
}
