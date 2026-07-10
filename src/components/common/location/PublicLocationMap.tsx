"use client";

import "leaflet/dist/leaflet.css";

import { Expand } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useIsMobile from "@/hooks/useIsMobile";

interface PublicLocationMapProps {
  latitude: number;
  longitude: number;
  title?: string | null;
}

interface LeafletMapProps {
  dragging: boolean;
  latitude: number;
  longitude: number;
  scrollWheelZoom: boolean;
}

function LeafletMap({ dragging, latitude, longitude, scrollWheelZoom }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let isMounted = true;

    const initMap = async () => {
      if (!containerRef.current || !isMounted) return;

      const L = await import("leaflet");

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      map = L.map(containerRef.current, {
        center: [latitude, longitude],
        dragging,
        scrollWheelZoom,
        zoom: 13,
        attributionControl: false,
      });

      L.control.attribution({ prefix: false }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">OpenStreetMap</a>',
      }).addTo(map);
      L.marker([latitude, longitude]).addTo(map);

      setTimeout(() => map?.invalidateSize(), 0);
    };

    initMap();

    return () => {
      isMounted = false;
      map?.remove();
      map = null;
    };
  }, [dragging, latitude, longitude, scrollWheelZoom]);

  return (
    <div
      ref={containerRef}
      className="z-0 h-full w-full md:rounded-lg [&_.leaflet-control-attribution]:!rounded-tl-[6px] [&_.leaflet-control-attribution]:!bg-white [&_.leaflet-control-attribution]:!pr-[10px] [&_.leaflet-control-attribution]:!pl-[3px]"
    />
  );
}

export function PublicLocationMap({ latitude, longitude, title }: PublicLocationMapProps) {
  const isMobile = useIsMobile();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Loading map...
      </div>
    );
  }

  return (
    <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
      <div className="relative h-full w-full">
        <LeafletMap
          dragging={!isMobile}
          latitude={latitude}
          longitude={longitude}
          scrollWheelZoom={false}
        />
        {isMobile && (
          <DialogTrigger
            render={
              <Button
                className="absolute top-2 right-2 z-10 rounded-full"
                variant="secondary"
                size="icon"
              >
                <Expand className="h-4 w-4" />
              </Button>
            }
          />
        )}
      </div>
      <DialogContent className="h-full w-full max-w-full rounded-none p-0">
        <div className="hidden">
          <DialogTitle>{title ? `Mapa: ${title}` : "Mapa lokalizacji"}</DialogTitle>
        </div>
        {isFullScreen ? (
          <LeafletMap
            dragging={true}
            latitude={latitude}
            longitude={longitude}
            scrollWheelZoom={true}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
