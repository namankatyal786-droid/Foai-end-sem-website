import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { ISSPosition } from "../../lib/types";
import { useEffect } from "react";

// Fix for default marker icons in Leaflet with React
// Using a simple custom div icon or a reliable URL
const issIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2094/2094498.png', // Satellite icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapRecenter({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

interface ISSMapProps {
  current: ISSPosition;
  history: ISSPosition[];
}

export function ISSMap({ current, history }: ISSMapProps) {
  const center: [number, number] = [current.latitude, current.longitude];
  const trajectory = history.slice(-15).map(p => [p.latitude, p.longitude] as [number, number]);

  return (
    <div id="iss-map-container" className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer 
        center={center} 
        zoom={3} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={trajectory} color="#3b82f6" weight={3} dashArray="5, 10" />
        <Marker position={center} icon={issIcon}>
          <Tooltip permanent direction="top" offset={[0, -20]}>
            ISS: {current.latitude.toFixed(2)}, {current.longitude.toFixed(2)}
          </Tooltip>
        </Marker>
        <MapRecenter position={center} />
      </MapContainer>
    </div>
  );
}
