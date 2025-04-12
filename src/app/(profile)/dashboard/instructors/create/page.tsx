"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Instructor</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input placeholder="Name" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        <Textarea placeholder="Bio (optional)" {...register("bio")} />
        <Input type="file" {...register("image")} />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          Create
        </Button>
      </form>
    </div>
  );
}
