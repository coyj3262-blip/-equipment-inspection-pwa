/**
 * JobSiteMapWithKmz Component
 *
 * Displays job site location with optional KMZ file overlays
 */

import { useState, useEffect } from "react";
import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import KmzMapLayer from "./KmzMapLayer";
import { getDocumentsBySite } from "../../services/documents";
import type { Coordinates } from "../../types/timeTracking";
import type { Document } from "../../types/documents";

interface JobSiteMapWithKmzProps {
  siteId: string;
  siteName: string;
  location: Coordinates;
  height?: string;
}

export default function JobSiteMapWithKmz({
  siteId,
  siteName,
  location,
  height = "400px"
}: JobSiteMapWithKmzProps) {
  const [kmzDocuments, setKmzDocuments] = useState<Document[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load KMZ documents for this site
  useEffect(() => {
    async function loadKmzDocs() {
      setLoading(true);
      try {
        const docs = await getDocumentsBySite(siteId);
        const kmzDocs = docs.filter(
          (doc) => doc.category === "kmz" || doc.fileType === "kmz" || doc.fileType === "kml"
        );
        setKmzDocuments(kmzDocs);

        // Auto-show all KMZ layers initially
        const allIds = new Set(kmzDocs.map((doc) => doc.id));
        setVisibleLayers(allIds);
      } catch (err) {
        console.error("Failed to load KMZ documents:", err);
      } finally {
        setLoading(false);
      }
    }

    loadKmzDocs();
  }, [siteId]);

  const toggleLayer = (docId: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border-2 border-slate-200" style={{ height }}>
        <Map
          defaultCenter={location}
          defaultZoom={16}
          mapId="job-site-kmz-map"
          mapTypeId="hybrid"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Site Marker */}
          <AdvancedMarker position={location}>
            <div className="bg-blue-500 text-white px-3 py-1 rounded-lg shadow-lg font-semibold text-sm">
              📍 {siteName}
            </div>
          </AdvancedMarker>

          {/* KMZ Layers */}
          {kmzDocuments.map((doc) => (
            <KmzMapLayer
              key={doc.id}
              url={doc.url}
              fileName={doc.name}
              visible={visibleLayers.has(doc.id)}
              onError={(err) => console.error(`KMZ layer error (${doc.name}):`, err)}
            />
          ))}
        </Map>

        {/* Site Name Badge */}
        <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md px-3 py-2 text-xs border border-slate-200 z-10">
          <div className="font-semibold text-slate-700">📍 {siteName}</div>
        </div>
      </div>

      {/* KMZ Layer Controls */}
      {kmzDocuments.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-navy-900">🗺️ Map Layers</h3>
            <span className="text-xs text-slate-500">
              {visibleLayers.size} / {kmzDocuments.length} visible
            </span>
          </div>

          <div className="space-y-2">
            {kmzDocuments.map((doc) => (
              <label
                key={doc.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleLayers.has(doc.id)}
                  onChange={() => toggleLayer(doc.id)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 focus:ring-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{doc.name}</div>
                  {doc.description && (
                    <div className="text-xs text-slate-500 truncate">{doc.description}</div>
                  )}
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">
                  KMZ
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* No KMZ Files Message */}
      {!loading && kmzDocuments.length === 0 && (
        <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
          <div className="text-3xl mb-2">🗺️</div>
          <p className="text-sm text-slate-600">
            No KMZ files attached to this job site yet.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Upload KMZ files in the Documents section to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
