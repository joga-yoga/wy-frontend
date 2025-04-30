"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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

export default function CreateInstructorPage() {
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data: any) {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.bio) formData.append("bio", data.bio);
    if (data.image?.[0]) formData.append("image", data.image[0]);

    try {
      await axiosInstance.post("/instructors", formData);
      toast({ description: "Instructor created!" });
      router.push("/dashboard/instructors");
    } catch {
      toast({ description: "Failed to create instructor", variant: "destructive" });
    }
  }

  return (
    <div className="p-6">
      <DashboardHeader
        title="Create Instructor"
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={isSubmitting ? "Creating..." : "Create"}
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
            Image (optional)
          </label>
          <Input id="image" type="file" {...register("image")} />
        </div>
      </form>
    </div>
  );
}
