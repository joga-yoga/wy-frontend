"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import type { InstructorProfile, InstructorYogaStyleIn } from "@/types/instructor";

import { YogaStyleSelector } from "../../app/(account)/account/partner/instructors/[instructorId]/edit/components/YogaStyleSelector";

/**
 * The instructor quick-editor (spec-b2b §8): photo, public name, bio, styles —
 * deliberately not the full roster editor (languages/cities/certificates live at
 * `instructors/[instructorId]/edit`). Shared between the header-avatar drawer (T08,
 * no status banner) and the roster editor (T10, passes `statusBanner`) — don't fork
 * this into two components.
 */
export function InstructorProfileForm({
  instructor,
  statusBanner,
  onSaved,
  onViewPublic,
}: {
  instructor: InstructorProfile;
  statusBanner?: ReactNode;
  onSaved: (updated: InstructorProfile) => void;
  onViewPublic?: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(instructor.name);
  const [bio, setBio] = useState(instructor.short_bio ?? "");
  const [yogaStyles, setYogaStyles] = useState<InstructorYogaStyleIn[]>(
    instructor.yoga_styles.map((s) => ({
      yoga_style_id: s.yoga_style_id,
      custom_name: s.custom_name,
      custom_icon_id: s.custom_icon_id,
      description: s.description,
    })),
  );
  const [imageId, setImageId] = useState<string | null>(instructor.image_id);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleImageSelect(file: File) {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axiosInstance.post<{ image_id: string }>(
        "/instructors/image-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setImageId(response.data.image_id);
    } catch {
      toast({ description: "Nie udało się przesłać zdjęcia.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const response = await axiosInstance.put<InstructorProfile>(`/instructors/${instructor.id}`, {
        name,
        short_bio: bio || null,
        image_id: imageId,
        yoga_styles: yogaStyles,
      });
      toast({ description: "Profil zapisany." });
      onSaved(response.data);
    } catch {
      toast({ description: "Nie udało się zapisać profilu.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-5 px-4 pb-4">
        {statusBanner}

        <div className="flex justify-center">
          <SingleImageUpload
            existingImageId={imageId}
            isUploading={isUploadingImage}
            onRemove={() => setImageId(null)}
            onFileSelect={handleImageSelect}
            previewClassName="h-24 w-24 rounded-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor-name">Imię (publiczne)</Label>
          <Input id="instructor-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor-bio">Bio</Label>
          <Textarea
            id="instructor-bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Style</Label>
          <YogaStyleSelector value={yogaStyles} onChange={setYogaStyles} />
        </div>

        {instructor.slug && (
          <p className="text-sm text-muted-foreground">
            Profil publiczny:{" "}
            <span className="font-medium text-foreground">joga.yoga/i/{instructor.slug}</span>
          </p>
        )}
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t bg-background px-4 py-3">
        {onViewPublic && (
          <Button type="button" variant="outline" className="flex-1" onClick={onViewPublic}>
            Zobacz
          </Button>
        )}
        <Button
          type="button"
          variant="green"
          className="flex-1"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>
    </div>
  );
}
