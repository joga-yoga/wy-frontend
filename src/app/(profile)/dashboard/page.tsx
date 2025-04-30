"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface Organizer {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    axiosInstance
      .get("/organizer/me")
      .then((res) => {
        setOrganizer(res.data);
        // If user is an organizer, fetch their instructors too
        return axiosInstance.get("/instructors");
      })
      .then((res) => {
        if (res) setInstructors(res.data);
      })
      .catch((err) => {
        // Don't redirect, just set organizer to null
        if (err.response?.status !== 404) {
          toast({
            description: "Failed to load organizer profile.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [toast]);

  if (loading) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  return (
    <div className="p-6">
      <DashboardHeader title="Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {organizer ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Organizer Profile</CardTitle>
                <CardDescription>Manage your organizer information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Welcome, {organizer.name}!</p>
                <Button variant="default" onClick={() => router.push("/dashboard/organizer")}>
                  View Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage Events</CardTitle>
                <CardDescription>Create and manage your events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Create new events or manage existing ones.</p>
                <Button variant="default" onClick={() => router.push("/dashboard/events")}>
                  Events Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructors</CardTitle>
                <CardDescription>Manage your event instructors</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  {instructors.length > 0
                    ? `You have ${instructors.length} instructor${instructors.length === 1 ? "" : "s"} registered.`
                    : "Add instructors for your events."}
                </p>
                <Button variant="default" onClick={() => router.push("/dashboard/instructors")}>
                  {instructors.length > 0 ? "Manage Instructors" : "Add Instructors"}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Become an Organizer</CardTitle>
              <CardDescription>Start hosting your own events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You&apos;re not registered as an organizer yet. Become an organizer to create and
                manage events.
              </p>
              <Link href="/become-organizer">
                <Button variant="default">Become an Organizer</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
