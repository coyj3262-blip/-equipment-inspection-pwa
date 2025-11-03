/**
 * InteractiveMap Component
 *
 * Interactive map for creating/editing job sites using Google Maps
 * Features:
 * - Click to place/move pin
 * - Draggable marker
 * - Radius visualization
 * - Coordinates update callback
 */

import { useState, useCallback, useEffect } from "react";
import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import type { Coordinates } from "../../types/timeTracking";
import { formatRadius } from "../../services/geolocation";

interface InteractiveMapProps {
  initialLocation?: Coordinates;
  initialRadius?: number;
  onLocationChange: (location: Coordinates) => void;
  onRadiusChange?: (radius: number) => void;
  height?: string;
}

function MapClickHandler({
  onPositionChange
}: {
  onPositionChange: (pos: Coordinates) => void;
}) {
  const map = useMap();

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onPositionChange({
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        });
      }
    },
    [onPositionChange]
  );

  // Add click listener
  useEffect(() => {
    if (map) {
      const listener = map.addListener('click', handleClick);
      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, handleClick]);

  return null;
}

function RadiusCircle({
  center,
  radius
}: {
  center: Coordinates;
  radius: number;
}) {
  const map = useMap();
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create circle if it doesn't exist
    if (!circle) {
      const newCircle = new google.maps.Circle({
        strokeColor: "#3b82f6",
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        map,
        center: { lat: center.lat, lng: center.lng },
        radius: radius * 0.3048 // Convert feet to meters
      });
      setCircle(newCircle);
    } else {
      // Update existing circle
      circle.setCenter({ lat: center.lat, lng: center.lng });
      circle.setRadius(radius * 0.3048);
    }

    return () => {
      if (circle) {
        circle.setMap(null);
      }
    };
  }, [map, center, radius, circle]);

  return null;
}

export default function InteractiveMap({
  initialLocation = { lat: 36.1627, lng: -86.7816 }, // Default to Nashville, TN
  initialRadius = 328,
  onLocationChange,
  onRadiusChange,
  height = "400px"
}: InteractiveMapProps) {
  const [position, setPosition] = useState<Coordinates>(initialLocation);
  const [radius, setRadius] = useState(initialRadius);

  const handlePositionChange = (newPos: Coordinates) => {
    setPosition(newPos);
    onLocationChange(newPos);
  };

  const handleMarkerDrag = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      handlePositionChange({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border-2 border-blue-200" style={{ height }}>
        <Map
          defaultCenter={position}
          defaultZoom={15}
          mapId="job-site-map"
          mapTypeId="hybrid"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker
            position={position}
            draggable={true}
            onDragEnd={handleMarkerDrag}
          />
          <RadiusCircle center={position} radius={radius} />
          <MapClickHandler onPositionChange={handlePositionChange} />
        </Map>

        {/* Instructions */}
        <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md px-3 py-2 text-xs border border-slate-200 max-w-xs z-10">
          <div className="font-semibold text-slate-700 mb-1">📍 Set Location</div>
          <div className="text-slate-600">
            Click map or drag marker to set job site location
          </div>
        </div>
      </div>

      {/* Coordinates Display */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={position.lat}
              onChange={(e) => handlePositionChange({ ...position, lat: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={position.lng}
              onChange={(e) => handlePositionChange({ ...position, lng: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
            />
          </div>
        </div>

        {/* Radius Control */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Verification Radius: {formatRadius(radius)}
          </label>
          <input
            type="range"
            min="164"
            max="1640"
            step="33"
            value={radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>164ft</span>
            <span>1640ft</span>
          </div>
        </div>
      </div>
    </div>
  );
}
