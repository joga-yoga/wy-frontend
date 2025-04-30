"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

// Schema from edit page
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.any().optional(), // For the file input
});

export default function OrganizerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null); // State for current image ID
  const router = useRouter(); // Keep router if needed for other actions
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // Fetch data and prefill form (from edit page, modified to get image_id)
  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/organizer/me")
      .then((res) => {
        setValue("name", res.data.name);
        setValue("description", res.data.description || "");
        setCurrentImageId(res.data.image_id || null); // Store current image ID
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          toast({
            title: "Not an Organizer",
            description: "Create an organizer profile first.",
            variant: "destructive",
          });
          router.push("/become-organizer"); // Redirect if not organizer
        } else {
          toast({ description: "Failed to load organizer profile.", variant: "destructive" });
          router.push("/dashboard"); // Redirect to dashboard on other errors
        }
      })
      .finally(() => setLoading(false));
  }, [setValue, toast, router]); // Added dependencies

  // Handle form submission (from edit page)
  async function onSubmit(data: any) {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.image?.[0]) {
      formData.append("image", data.image[0]);
    }

    try {
      const response = await axiosInstance.put("/organizer", formData);
      toast({ description: "Profile updated successfully!" });
      // Update current image ID if a new image was uploaded and returned
      if (response.data?.image_id) {
        setCurrentImageId(response.data.image_id);
      }
      // No redirect - stay on the page
    } catch (error: any) {
      toast({
        description: `Update failed: ${error?.response?.data?.detail || error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  }

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-6">
      <DashboardHeader
        title="Organizer Profile"
        onUpdate={handleSubmit(onSubmit)} // Pass submit handler
        updateLabel={isSubmitting ? "Updating..." : undefined} // Show loading state on button
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        {/* Form fields from edit page */}
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

        {/* Image display and upload */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">
            Profile Image
          </label>
          {/* Display current image if exists */}
          {currentImageId && (
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-1">Current Image:</p>
              <img
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${currentImageId}`}
                alt="Current Organizer Profile"
                className="max-h-40 max-w-40 rounded-md border object-cover"
              />
            </div>
          )}
          <Input id="image" type="file" accept="image/*" {...register("image")} />
          <p className="text-xs text-gray-500 mt-1">
            Upload a new image to replace the current one.
          </p>
        </div>
        {/* Submit button is now in the header */}
      </form>
    </div>
  );
}
