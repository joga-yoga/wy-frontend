"use client";

import { format } from "date-fns";
import { CalendarDays, DollarSign, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface Organizer {
  id: string;
  name: string;
}

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

export default function DashboardPage() {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loadingOrganizer, setLoadingOrganizer] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let isRedirecting = false;
    setLoadingOrganizer(true);
    axiosInstance
      .get("/organizer/me")
      .then((res) => {
        setOrganizer(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          isRedirecting = true;
          router.replace("/become-organizer");
        } else {
          toast({
            description: "Failed to load organizer profile.",
            variant: "destructive",
          });
          setOrganizer(null);
        }
      })
      .finally(() => {
        if (!isRedirecting) {
          setLoadingOrganizer(false);
        }
      });
  }, [toast, router]);

  useEffect(() => {
    if (organizer && !loadingOrganizer) {
      setLoadingEvents(true);
      axiosInstance
        .get("/events")
        .then((res) => setEvents(res.data))
        .catch((err) => {
          console.error("Failed to fetch events", err);
          toast({
            description: "Failed to load your events.",
            variant: "destructive",
          });
        })
        .finally(() => setLoadingEvents(false));
    }
  }, [organizer, loadingOrganizer, toast]);

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

  if (loadingOrganizer) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  if (!organizer) {
    return (
      <p className="text-center mt-20">Failed to load your profile. Please try again later.</p>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">{`Welcome, ${organizer.name}!`}</h1>

      <div className="mt-6 space-y-6 max-w-4xl">
        {loadingEvents ? (
          <p className="text-center text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">You haven&apos;t created any events yet.</p>
            <Button variant="default" onClick={() => router.push("/dashboard/events/create")}>
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                      event.is_public
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {event.is_public ? "Public" : "Private"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>

                <div className="mt-3 text-sm text-gray-500 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Need fix
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> {formatDate(event.start_date)}
                  </span>
                  {event.end_date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" /> {formatDate(event.end_date)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> ${event.price?.toFixed(2) ?? "N/A"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <Link href={`/dashboard/events/${event.id}/edit`} passHref>
                    <Button variant="outline" size="sm" className="text-xs">
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog onOpenChange={(open: boolean) => !open && setEventIdToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setEventIdToDelete(event.id)}
                        disabled={isDeleting}
                        className="text-xs"
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
                            &quot;<strong>{event.title}</strong>&quot;.
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
                  <Link href={`/events/${event.id}`} passHref>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View Public Page
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loadingEvents && events.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button variant="default" onClick={() => router.push("/dashboard/events/create")}>
              Create New Event
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
