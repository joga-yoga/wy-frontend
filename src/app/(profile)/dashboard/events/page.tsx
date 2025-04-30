"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  price: number;
  image_id?: string;
  is_public: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/events")
      .then((res) => setEvents(res.data))
      .catch((err) => {
        console.error("Failed to fetch events", err);
        toast({
          description: "Failed to load events.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const formatDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date format";
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const handleDelete = async () => {
    if (!eventIdToDelete) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/events/${eventIdToDelete}`);
      toast({ description: "Event deleted successfully!" });
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventIdToDelete));
      setEventIdToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete event:", error);
      toast({
        description: `Failed to delete event: ${error.response?.data?.detail || error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-20">Loading events...</p>;
  }

  return (
    <div className="p-6">
      <DashboardHeader
        title="Your Events"
        onCreate={() => router.push("/dashboard/events/create")}
        createLabel="Create Event"
      />

      <div className="space-y-6 max-w-4xl">
        {events.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">You haven&apos;t created any events yet</p>
            <Button variant="default" onClick={() => router.push("/dashboard/events/create")}>
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">{event.title}</h2>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-md ${
                      event.is_public
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                  >
                    {event.is_public ? "Public" : "Private"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>

                <div className="mt-3 text-sm text-gray-500 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                  <p>📍 {event.location || "N/A"}</p>
                  <p>📅 {formatDate(event.start_date)}</p>
                  <p>💰 ${event.price?.toFixed(2) ?? "N/A"}</p>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <AlertDialog onOpenChange={(open: boolean) => !open && setEventIdToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setEventIdToDelete(event.id)}
                        disabled={isDeleting}
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    {eventIdToDelete === event.id && (
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event
                            &quot;
                            <strong>{events.find((e) => e.id === eventIdToDelete)?.title}</strong>
                            &quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={isDeleting}
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? "Deleting..." : "Yes, delete event"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    )}
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
