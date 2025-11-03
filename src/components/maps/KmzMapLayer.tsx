/**
 * KmzMapLayer Component
 *
 * Displays KMZ/KML files as layers on Google Maps
 */

import { useEffect, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { parseKmzFromUrl, parseKmlFromText, kmlToDataUri, isKmzFile } from "../../services/kmzParser";
import type { KmzData } from "../../types/documents";

interface KmzMapLayerProps {
  url: string;
  fileName: string;
  visible?: boolean;
  onLoad?: (data: KmzData) => void;
  onError?: (error: Error) => void;
}

export default function KmzMapLayer({
  url,
  fileName,
  visible = true,
  onLoad,
  onError
}: KmzMapLayerProps) {
  const map = useMap();
  const [kmlLayer, setKmlLayer] = useState<google.maps.KmlLayer | null>(null);

  useEffect(() => {
    if (!map || !visible) {
      // Remove layer if not visible
      if (kmlLayer) {
        kmlLayer.setMap(null);
      }
      return;
    }

    async function loadKmz() {
      try {
        let kmzData: KmzData;

        if (isKmzFile(fileName)) {
          // Parse KMZ file
          kmzData = await parseKmzFromUrl(url);
        } else {
          // Direct KML file - fetch and parse
          const response = await fetch(url);
          const kmlText = await response.text();
          kmzData = parseKmlFromText(kmlText);
        }

        // Create KML layer
        // Note: Google Maps KmlLayer requires a publicly accessible URL
        // For KMZ files, we need to extract and use the KML data
        const layer = new google.maps.KmlLayer({
          url: url, // Try direct URL first (works for public KML/KMZ files)
          map: map,
          preserveViewport: true,
          suppressInfoWindows: false
        });

        // Handle load errors - fallback to data URI if needed
        google.maps.event.addListener(layer, "status_changed", () => {
          const status = layer.getStatus();
          if (status !== google.maps.KmlLayerStatus.OK) {
            console.warn("KML layer failed to load, trying data URI method");

            // Fallback: Use data URI (only works for small KML files)
            if (kmzData && kmzData.kml.length < 100000) {
              layer.setMap(null);
              const dataUri = kmlToDataUri(kmzData.kml);
              const fallbackLayer = new google.maps.KmlLayer({
                url: dataUri,
                map: map,
                preserveViewport: true
              });
              setKmlLayer(fallbackLayer);
            } else {
              if (onError) {
                onError(new Error("KML file too large for data URI method"));
              }
            }
          }
        });

        setKmlLayer(layer);

        if (onLoad) {
          onLoad(kmzData);
        }
      } catch (err) {
        console.error("Failed to load KMZ layer:", err);
        if (onError) {
          onError(err instanceof Error ? err : new Error("Unknown error"));
        }
      }
    }

    loadKmz();

    // Cleanup
    return () => {
      if (kmlLayer) {
        kmlLayer.setMap(null);
      }
    };
  }, [map, url, fileName, visible]);

  // Toggle visibility
  useEffect(() => {
    if (kmlLayer) {
      kmlLayer.setMap(visible ? map : null);
    }
  }, [kmlLayer, visible, map]);

  return null; // This component doesn't render anything directly
}
