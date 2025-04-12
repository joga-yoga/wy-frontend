"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";

interface Instructor {
  id: string;
  name: string;
  bio: string;
  image_id: string;
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const router = useRouter();

  useEffect(() => {
    axiosInstance
      .get("/instructors")
      .then((res) => setInstructors(res.data))
      .catch((err) => console.error("Failed to fetch instructors", err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Instructors</h1>
        <Button onClick={() => router.push("/dashboard/instructors/create")}>Add Instructor</Button>
      </div>

      <div className="space-y-6">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="border rounded-lg p-4 shadow-sm flex gap-4">
            {instructor.image_id && (
              <Image
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${instructor.image_id}`}
                alt={instructor.name}
                width={80}
                height={80}
                className="rounded object-cover"
              />
            )}
            <div className="flex-grow">
              <h2 className="text-lg font-semibold">{instructor.name}</h2>
              <p className="text-sm text-gray-600">{instructor.bio}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push(`/dashboard/instructors/${instructor.id}/edit`)}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
