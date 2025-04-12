"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.any().optional(),
});

export default function BecomeOrganizerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    axiosInstance
      .get("/organizer/me")
      .then(() => {
        // User is already an organizer, redirect them
        router.push("/dashboard");
      })
      .catch((err) => {
        // 404 means user is not an organizer, do nothing
        if (err.response?.status !== 404) {
          toast({
            description: "Something went wrong while checking organizer status.",
            variant: "destructive",
          });
        }
      });
  }, []);

  async function onSubmit(data: { name: string; description?: string; image?: FileList }) {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.image?.[0]) {
      formData.append("image", data.image[0]);
    }

    try {
      await axiosInstance.post("/organizer", formData);
      toast({ description: "You are now an organizer!" });
      router.push("/dashboard");
    } catch (err) {
      toast({
        description: "Failed to become an organizer. Try again.",
        variant: "destructive",
      });
    }
  }
  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Become an Organizer</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input placeholder="Organizer name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        <Textarea placeholder="Description (optional)" {...register("description")} />
        <Input type="file" {...register("image")} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Submit
        </Button>
      </form>
    </div>
  );
}
