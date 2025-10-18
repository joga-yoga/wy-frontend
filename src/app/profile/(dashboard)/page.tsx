"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getImageUrl } from "@/app/retreats/retreats/[retreatId]/helpers";
import CustomPlusIconMobile from "@/components/icons/CustomPlusIconMobile";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface Organizer {
  id: string;
  name: string;
}

interface BaseEvent {
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

type DashboardItem = BaseEvent & { kind: "retreat" | "workshop" };

const getEventStatus = (event: BaseEvent): { text: string; className: string } => {
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
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DashboardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "retreat" | "workshop">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      setLoadingItems(true);
      Promise.all([
        axiosInstance
          .get<BaseEvent[]>("/retreats")
          .then((r) => r.data.map((e) => ({ ...e, kind: "retreat" as const })))
          .catch(() => []),
        axiosInstance
          .get<BaseEvent[]>("/workshops")
          .then((r) => r.data.map((e) => ({ ...e, kind: "workshop" as const })))
          .catch(() => []),
      ])
        .then(([retreats, workshops]) => {
          setItems([...(retreats || []), ...(workshops || [])]);
        })
        .catch((err) => {
          console.error("Failed to fetch retreats/workshops", err);
          toast({
            description: "Nie udało się załadować Twoich wyjazdów i warsztatów.",
            variant: "destructive",
          });
        })
        .finally(() => setLoadingItems(false));
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
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const endpoint = itemToDelete.kind === "workshop" ? "/workshops" : "/retreats";
      await axiosInstance.delete(`${endpoint}/${itemToDelete.id}`);
      toast({
        description:
          itemToDelete.kind === "workshop"
            ? "Warsztat usunięty pomyślnie!"
            : "Wyjazd usunięty pomyślnie!",
      });
      setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete event:", error);
      toast({
        description: `Nie udało się usunąć pozycji: ${error.response?.data?.detail || error.message}`,
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Twoje ogłoszenia</h1>
        <button
          type="button"
          aria-label="Dodaj nowe ogłoszenie"
          onClick={() => setIsCreateOpen(true)}
        >
          <CustomPlusIconMobile />
        </button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Co chcesz dodać?</DialogTitle>
            <DialogDescription>Wybierz typ ogłoszenia.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link
              href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}/retreats/create`}
              onClick={() => setIsCreateOpen(false)}
              className="border rounded-xl p-6 hover:shadow-md transition bg-white flex flex-col items-center justify-center text-center"
            >
              <div className="text-6xl select-none">🏕️</div>
              <div className="mt-3 text-base font-semibold">Wyjazd</div>
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}/workshops/create`}
              onClick={() => setIsCreateOpen(false)}
              className="border rounded-xl p-6 hover:shadow-md transition bg-white flex flex-col items-center justify-center text-center"
            >
              <div className="text-6xl select-none">🧘‍♀️</div>
              <div className="mt-3 text-base font-semibold">Wydarzenie</div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2 rounded-full text-sm transition-colors ${
            activeTab === "all"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Wszystkie
        </button>
        <button
          onClick={() => setActiveTab("retreat")}
          className={`px-5 py-2 rounded-full text-sm transition-colors ${
            activeTab === "retreat"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Wyjazdy
        </button>
        <button
          onClick={() => setActiveTab("workshop")}
          className={`px-5 py-2 rounded-full text-sm transition-colors ${
            activeTab === "workshop"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Wydarzenia
        </button>
      </div>

      <div className="mt-6 space-y-6 max-w-4xl">
        {loadingItems ? (
          <p className="text-center text-gray-500">Ładowanie Twoich ogłoszeń...</p>
        ) : (activeTab === "all"
            ? items
            : items.filter((it) => it.kind === (activeTab === "retreat" ? "retreat" : "workshop"))
          ).length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">Nie utworzyłeś jeszcze żadnych ogłoszeń.</p>
            <Button variant="default" onClick={() => setIsCreateOpen(true)}>
              Utwórz swoje pierwsze ogłoszenie
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {(activeTab === "all"
              ? items
              : items.filter((it) => it.kind === (activeTab === "retreat" ? "retreat" : "workshop"))
            ).map((event) => {
              const status = getEventStatus(event);
              return (
                <div
                  key={event.id}
                  className="border rounded-lg shadow-sm bg-white flex flex-col md:flex-row overflow-hidden min-h-[184px]"
                >
                  <Image
                    src={getImageUrl(event.image_ids?.[0] || event.image_id)}
                    alt={event.title}
                    width={200}
                    height={200}
                    className="object-cover min-w-[200px] w-full md:w-[200px] h-[200px]"
                  />
                  <div className="p-4 flex flex-col justify-between w-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          {event.title}
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {event.kind === "workshop" ? "Workshop" : "Retreat"}
                          </span>
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      <Link
                        href={
                          event.kind === "workshop"
                            ? `${process.env.NEXT_PUBLIC_PROFILE_HOST}/workshops/${event.id}/edit`
                            : `${process.env.NEXT_PUBLIC_PROFILE_HOST}/retreats/${event.id}/edit`
                        }
                        passHref
                      >
                        <Button variant="outline" size="sm" className="text-xs">
                          Edytuj
                        </Button>
                      </Link>
                      <AlertDialog onOpenChange={(open: boolean) => !open && setItemToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setItemToDelete(event)}
                            disabled={isDeleting}
                            className="text-xs"
                          >
                            Usuń
                          </Button>
                        </AlertDialogTrigger>
                        {itemToDelete?.id === event.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie{" "}
                                {event.kind === "workshop" ? "warsztatu" : "wyjazdu"}
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
                                {isDeleting
                                  ? "Usuwanie..."
                                  : `Tak, usuń ${event.kind === "workshop" ? "warsztat" : "wyjazd"}`}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                      <Link
                        href={
                          event.kind === "workshop"
                            ? `${process.env.NEXT_PUBLIC_WORKSHOPS_HOST}/workshops/${event.id}`
                            : `${process.env.NEXT_PUBLIC_RETREATS_HOST}/retreats/${event.id}`
                        }
                        passHref
                      >
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
      </div>
    </div>
  );
}
