"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  image: z.any().optional(),
});

export default function EditInstructorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    axiosInstance
      .get(`/instructors/${id}`)
      .then((res) => {
        setValue("name", res.data.name);
        setValue("bio", res.data.bio || "");
        setCurrentImageId(res.data.image_id || null);
      })
      .catch(() => {
        toast({ description: "Failed to load instructor", variant: "destructive" });
        router.push("/dashboard/instructors");
      })
      .finally(() => setLoading(false));
  }, [id, setValue, router, toast]);

  async function onSubmit(data: any) {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.bio) formData.append("bio", data.bio);
    if (data.image?.[0]) formData.append("image", data.image[0]);

    try {
      const response = await axiosInstance.put(`/instructors/${id}`, formData);
      toast({ description: "Instructor updated!" });

      if (response.data?.image_id) {
        setCurrentImageId(response.data.image_id);
      }
      router.push("/dashboard/instructors");
    } catch (error: any) {
      toast({
         description: `Update failed: ${error?.response?.data?.detail || error?.message || "Unknown error"}`,
         variant: "destructive"
       });
    }
  }

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-6">
      <DashboardHeader
        title="Edit Instructor"
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={isSubmitting ? "Saving..." : "Save Changes"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input id="name" placeholder="Name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>}
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio (optional)
          </label>
          <Textarea id="bio" placeholder="Bio (optional)" {...register("bio")} />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">
            Profile Image
          </label>
          {currentImageId && (
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-1">Current Image:</p>
              <img
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_100,h_100,c_fill/${currentImageId}`}
                alt="Current Instructor"
                className="max-h-24 max-w-24 rounded-md border object-cover"
              />
            </div>
          )}
          <Input id="image" type="file" accept="image/*" {...register("image")} />
          <p className="text-xs text-gray-500 mt-1">Upload a new image to replace the current one.</p>
        </div>
      </form>
    </div>
  );
}
