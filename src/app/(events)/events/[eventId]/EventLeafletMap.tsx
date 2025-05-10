"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useState } from "react";
import L from "leaflet";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import MarkerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import MarkerShadow from "leaflet/dist/images/marker-shadow.png";

interface EventLeafletMapProps {
  latitude: number;
  longitude: number;
  title?: string | null;
}

const EventLeafletMap = ({ latitude, longitude, title }: EventLeafletMapProps) => {
  const [Map, setMap] = useState<any>(null);

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

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-48 w-full rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} />
    </MapContainer>
  );
};

export default EventLeafletMap