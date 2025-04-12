"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface Organizer {
  id: string;
  name: string;
  description?: string;
  image_id?: string;
}

export default function DashboardPage() {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    axiosInstance
      .get("/organizer/me")
      .then((res) => {
        setOrganizer(res.data);
      })
      .catch((err) => {
        toast({
          description: "Failed to load organizer profile.",
          variant: "destructive",
        });
        router.push("/become-organizer");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  if (!organizer) {
    return null;
  }
  console.log("🚀 ~ DashboardPage ~ process.env:", process.env);

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Organizer Profile</h1>
      <div className="space-y-4">
        <p>
          <strong>Name:</strong> {organizer.name}
        </p>
        {organizer.description && (
          <p>
            <strong>Description:</strong> {organizer.description}
          </p>
        )}
        {organizer.image_id && (
          <div>
            <strong>Image:</strong>
            <img
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${organizer.image_id}`}
              alt="Organizer"
              className="mt-2 max-h-64 object-contain"
            />
          </div>
        )}
        <Button onClick={() => router.push("/dashboard/organizer")}>Edit Profile</Button>
      </div>
    </div>
  );
}
