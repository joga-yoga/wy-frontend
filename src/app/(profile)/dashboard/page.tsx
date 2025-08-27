"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getImageUrl } from "@/app/(events)/events/[eventId]/helpers";
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
  image_ids?: string[];
  image_id?: string;
  is_public: boolean;
}

const getEventStatus = (event: Event): { text: string; className: string } => {
  if (!event.is_public) {
    return {
      text: "Prywatne",
      className: "bg-gray-100 text-gray-700 border border-gray-300",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventEndDate = event.end_date ? new Date(event.end_date) : null;

  if (eventEndDate && eventEndDate < today) {
    return {
      text: "Minęło",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  return {
    text: "Publiczne",
    className: "bg-green-100 text-green-800",
  };
};

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
            description: "Nie udało się załadować profilu organizatora.",
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
            description: "Nie udało się załadować Twoich wydarzeń.",
            variant: "destructive",
          });
        })
        .finally(() => setLoadingEvents(false));
    }
  }, [organizer, loadingOrganizer, toast]);

  const formatDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return "Brak danych";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Nieprawidłowy format daty";
      return format(date, "d MMM yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Nieprawidłowa data";
    }
  };

  const handleDelete = async () => {
    if (!eventIdToDelete) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/events/${eventIdToDelete}`);
      toast({ description: "Wyjazd usunięty pomyślnie!" });
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventIdToDelete));
      setEventIdToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete event:", error);
      toast({
        description: `Nie udało się usunąć wyjazdu: ${error.response?.data?.detail || error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loadingOrganizer) {
    return <p className="text-center mt-20">Ładowanie...</p>;
  }

  if (!organizer) {
    return (
      <p className="text-center mt-20">
        Nie udało się załadować Twojego profilu. Spróbuj ponownie później.
      </p>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">{`Witaj, ${organizer.name}!`}</h1>

      <div className="mt-6 space-y-6 max-w-4xl">
        {loadingEvents ? (
          <p className="text-center text-gray-500">Ładowanie wydarzeń...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">Nie utworzyłeś jeszcze żadnych wydarzeń.</p>
            <Button variant="default" onClick={() => router.push("/dashboard/events/create")}>
              Utwórz swoje pierwsze wyjazd
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => {
              const status = getEventStatus(event);
              return (
                <div
                  key={event.id}
                  className="border rounded-lg shadow-sm bg-white flex flex-col md:flex-row overflow-hidden min-h-[184px]"
                >
                  <div className="relative w-full md:w-[200px] md:flex-shrink-0 h-48 md:h-auto">
                    <Image
                      src={getImageUrl(event.image_ids?.[0] || event.image_id)}
                      alt={event.title}
                      layout="fill"
                      objectFit="cover"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-between w-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      <Link href={`/dashboard/events/${event.id}/edit`} passHref>
                        <Button variant="outline" size="sm" className="text-xs">
                          Edytuj
                        </Button>
                      </Link>
                      <AlertDialog
                        onOpenChange={(open: boolean) => !open && setEventIdToDelete(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setEventIdToDelete(event.id)}
                            disabled={isDeleting}
                            className="text-xs"
                          >
                            Usuń
                          </Button>
                        </AlertDialogTrigger>
                        {eventIdToDelete === event.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie wyjazdu
                                &quot;
                                <strong>{event.title}</strong>&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                              <AlertDialogAction
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting ? "Usuwanie..." : "Tak, usuń wyjazd"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                      <Link href={`/events/${event.id}`} passHref>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Zobacz stronę publiczną
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loadingEvents && events.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button variant="default" onClick={() => router.push("/dashboard/events/create")}>
              Utwórz nowy wyjazd
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
