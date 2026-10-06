"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { GeoPoint } from "@/lib/tourneeGeo";

function SelectPosition({
  value,
  onChange,
}: {
  value: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
}) {
  const map = useMapEvents({
    click: (event) => onChange({ lat: event.latlng.lat, lon: event.latlng.lng }),
  });
  useEffect(() => {
    if (value) map.panTo([value.lat, value.lon]);
  }, [map, value?.lat, value?.lon]);
  return value ? (
    <CircleMarker
      center={[value.lat, value.lon]}
      radius={9}
      pathOptions={{ color: "#9a3412", fillColor: "#fb923c", fillOpacity: 0.9 }}
    />
  ) : null;
}

export default function CoordinatePicker({
  value,
  onChange,
}: {
  value: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
}) {
  return (
    <div className="h-64 overflow-hidden rounded-md border border-stone-300 sm:h-72">
      <MapContainer
        center={value ? [value.lat, value.lon] : [48.28, -3.31]}
        zoom={value ? 15 : 12}
        className="h-full w-full"
        aria-label="Position GPS du lieu-dit"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SelectPosition value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
