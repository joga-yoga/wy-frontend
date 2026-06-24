"use client";

import "leaflet/dist/leaflet.css";

import { Expand } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useIsMobile from "@/hooks/useIsMobile";

interface EventLeafletMapProps {
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

const LeafletMap = ({ dragging, latitude, longitude, scrollWheelZoom }: LeafletMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let isMounted = true;

    const initMap = async () => {
      if (!containerRef.current || !isMounted) {
        return;
      }

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
      className="h-full w-full md:rounded-lg z-0 [&_.leaflet-control-attribution]:!bg-white [&_.leaflet-control-attribution]:!pr-[10px] [&_.leaflet-control-attribution]:!pl-[3px] [&_.leaflet-control-attribution]:!rounded-tl-[6px]"
    />
  );
};

const EventLeafletMap = ({ latitude, longitude, title }: EventLeafletMapProps) => {
  const isMobile = useIsMobile();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
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
          <DialogTrigger asChild>
            <Button
              className="absolute top-2 right-2 rounded-full z-10"
              variant="secondary"
              size="icon"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        )}
      </div>
      <DialogContent className="h-full w-full p-0 max-w-full rounded-none">
        <div className="hidden">
          <DialogTitle>Map</DialogTitle>
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
};

export default EventLeafletMap;
