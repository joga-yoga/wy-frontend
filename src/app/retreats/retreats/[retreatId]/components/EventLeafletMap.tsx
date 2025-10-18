"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import MarkerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import MarkerShadow from "leaflet/dist/images/marker-shadow.png";
import { Expand } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useIsMobile from "@/hooks/useIsMobile";

interface EventLeafletMapProps {
  latitude: number;
  longitude: number;
  title?: string | null;
}

const EventLeafletMap = ({ latitude, longitude, title }: EventLeafletMapProps) => {
  const [Map, setMap] = useState<any>(null);
  const isMobile = useIsMobile();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Import Leaflet components only on client side
    const initMap = async () => {
      const L = await import("leaflet");
      const { MapContainer, TileLayer, Marker } = await import("react-leaflet");

      // Fix Leaflet default icon issue
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: MarkerIcon2x.src,
        iconUrl: MarkerIcon.src,
        shadowUrl: MarkerShadow.src,
      });

      setMap({ MapContainer, TileLayer, Marker });
    };

    initMap();
  }, []);

  if (!Map) {
    return (
      <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
        Loading map...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker } = Map;

  const renderMap = (isFullScreenMap = false) => (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={isFullScreenMap}
      dragging={isFullScreenMap || !isMobile}
      className="h-full w-full md:rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} />
    </MapContainer>
  );

  return (
    <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
      <div className="relative h-[440px] w-full">
        {renderMap(false)}
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
        {renderMap(true)}
      </DialogContent>
    </Dialog>
  );
};

export default EventLeafletMap;
