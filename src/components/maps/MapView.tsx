/**
 * MapView Component
 *
 * Reusable map component for displaying clock-in/out locations
 * relative to job site center with verification radius using Google Maps
 */

import { useMemo, useState, useEffect } from "react";
import { Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import type { Coordinates } from "../../types/timeTracking";
import { formatDistance, formatRadius } from "../../services/geolocation";

interface MapViewProps {
  siteLocation: Coordinates;
  siteName: string;
  userLocation: Coordinates;
  userName?: string;
  radiusMeters: number; // Keep prop name for backwards compatibility, but value is in feet
  withinRadius: boolean;
  distance: number; // Distance in feet
  accuracy?: number; // GPS accuracy in feet
  height?: string;
}

function RadiusCircle({
  center,
  radius,
  withinRadius
}: {
  center: Coordinates;
  radius: number;
  withinRadius: boolean;
}) {
  const map = useMap();
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create circle if it doesn't exist
    if (!circle) {
      const newCircle = new google.maps.Circle({
        strokeColor: withinRadius ? "#10b981" : "#f59e0b",
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: withinRadius ? "#10b981" : "#f59e0b",
        fillOpacity: 0.1,
        map,
        center: { lat: center.lat, lng: center.lng },
        radius: radius * 0.3048 // Convert feet to meters
      });
      setCircle(newCircle);
    } else {
      // Update existing circle
      circle.setCenter({ lat: center.lat, lng: center.lng });
      circle.setRadius(radius * 0.3048);
      circle.setOptions({
        strokeColor: withinRadius ? "#10b981" : "#f59e0b",
        fillColor: withinRadius ? "#10b981" : "#f59e0b"
      });
    }

    return () => {
      if (circle) {
        circle.setMap(null);
      }
    };
  }, [map, center, radius, withinRadius, circle]);

  return null;
}

export default function MapView({
  siteLocation,
  siteName,
  userLocation,
  userName,
  radiusMeters,
  withinRadius,
  distance,
  accuracy = 0,
  height = "300px"
}: MapViewProps) {
  const [siteInfoOpen, setSiteInfoOpen] = useState(false);
  const [userInfoOpen, setUserInfoOpen] = useState(false);

  // Calculate center point between site and user
  const center = useMemo(() => ({
    lat: (siteLocation.lat + userLocation.lat) / 2,
    lng: (siteLocation.lng + userLocation.lng) / 2
  }), [siteLocation, userLocation]);

  // Calculate appropriate zoom level based on distance
  const zoom = useMemo(() => {
    // Convert feet to meters for zoom calculation
    const distanceMeters = distance * 0.3048;
    if (distanceMeters < 100) return 17;
    if (distanceMeters < 500) return 15;
    if (distanceMeters < 1000) return 14;
    if (distanceMeters < 5000) return 12;
    return 11;
  }, [distance]);

  // Custom pin colors (using data URIs for colored pins)
  const bluePinSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="40" height="40">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    </svg>
  `);

  const greenPinSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="40" height="40">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    </svg>
  `);

  const orangePinSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="40" height="40">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    </svg>
  `);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height }}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="time-entry-map"
        mapTypeId="hybrid"
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Job Site Marker (Blue) */}
        <AdvancedMarker
          position={siteLocation}
          onClick={() => setSiteInfoOpen(true)}
        >
          <img src={`data:image/svg+xml,${bluePinSvg}`} width="30" height="30" alt="Site" />
        </AdvancedMarker>
        {siteInfoOpen && (
          <InfoWindow
            position={siteLocation}
            onCloseClick={() => setSiteInfoOpen(false)}
          >
            <div className="text-sm">
              <div className="font-bold text-blue-600">{siteName}</div>
              <div className="text-xs text-slate-600 mt-1">Job Site Center</div>
              <div className="text-xs text-slate-500 mt-1">
                Radius: {formatRadius(radiusMeters)}
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Verification Radius Circle */}
        <RadiusCircle center={siteLocation} radius={radiusMeters} withinRadius={withinRadius} />

        {/* User Clock-In/Out Location (Green if within, Orange if outside) */}
        <AdvancedMarker
          position={userLocation}
          onClick={() => setUserInfoOpen(true)}
        >
          <img
            src={`data:image/svg+xml,${withinRadius ? greenPinSvg : orangePinSvg}`}
            width="30"
            height="30"
            alt="User Location"
          />
        </AdvancedMarker>
        {userInfoOpen && (
          <InfoWindow
            position={userLocation}
            onCloseClick={() => setUserInfoOpen(false)}
          >
            <div className="text-sm">
              <div className="font-bold text-slate-900">
                {userName || "Clock-in Location"}
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  <span className={withinRadius ? "text-green-600" : "text-orange-600"}>
                    {withinRadius ? "✓ Within radius" : "⚠ Outside radius"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Distance:</span> {formatDistance(distance)} from site
                </div>
                {accuracy > 0 && (
                  <div>
                    <span className="font-semibold">GPS Accuracy:</span> ±{Math.round(accuracy)}ft
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white rounded-lg shadow-md px-3 py-2 text-xs space-y-1 border border-slate-200 z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Job Site</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${withinRadius ? "bg-green-500" : "bg-orange-500"}`}></div>
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
}
