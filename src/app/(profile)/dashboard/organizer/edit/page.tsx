"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.any().optional(),
});

export default function EditOrganizerPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    axiosInstance
      .get("/organizer/me")
      .then((res) => {
        setValue("name", res.data.name);
        setValue("description", res.data.description || "");
      })
      .catch(() => {
        toast({ description: "Failed to load organizer", variant: "destructive" });
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: any) {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.image?.[0]) formData.append("image", data.image[0]);

    try {
      await axiosInstance.put("/organizer", formData);
      toast({ description: "Profile updated successfully!" });
      router.push("/dashboard/organizer");
    } catch {
      toast({ description: "Update failed", variant: "destructive" });
    }
  }

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Edit Organizer Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input id="name" placeholder="Name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea id="description" placeholder="Description" {...register("description")} />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">
            Profile Image
          </label>
          <Input id="image" type="file" {...register("image")} />
        </div>

        <div className="flex gap-4 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/organizer")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
