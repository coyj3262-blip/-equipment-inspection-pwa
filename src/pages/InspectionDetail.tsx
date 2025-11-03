import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { rtdb } from "../firebase";
import Header from "../components/ui/Header";
import Tag from "../components/ui/Tag";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import PhotoLightbox from "../components/ui/PhotoLightbox";
import { HistoryIcon } from "../components/icons";
import { ref, get } from "firebase/database";
import type { Inspection as InspectionType } from "../backend.rtdb";

type Inspection = InspectionType & {
  signature?: string;
};

export default function InspectionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadInspection() {
      const inspRef = ref(rtdb, `/v2/inspections/${id}`);
      const snapshot = await get(inspRef);

      if (snapshot.exists()) {
        setInspection(snapshot.val());
      }
      setLoading(false);
    }

    loadInspection();
  }, [id]);

  const openLightbox = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Inspection Detail" subtitle="Loading..." />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" message="Loading inspection details..." />
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Inspection Detail" subtitle="Not found" />
        <EmptyState
          icon={<HistoryIcon size={64} className="text-slate-300" />}
          title="Inspection not found"
          description="This inspection may have been deleted or you may not have permission to view it."
          action={{
            label: "Back to History",
            onClick: () => navigate("/history")
          }}
        />
      </div>
    );
  }

  const duration = inspection.submittedAt && inspection.startedAt
    ? Math.floor((inspection.submittedAt - inspection.startedAt) / 1000)
    : 0;

  return (
    <div className="pb-6">
      <Header
        title={inspection.equipmentType.replace("_", " ")}
        subtitle={<span>Equipment ID: {inspection.equipmentId} Â· <Link to="/history" className="underline decoration-white/30 hover:decoration-white">Back to History</Link></span>}
      />

      {/* Details */}
      <div className="p-4 space-y-4">
        {/* Info Card */}
        <div className="bg-white rounded-card shadow-card p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Status</span>
            <Tag kind={inspection.state}>{inspection.state.replace("_", " ")}</Tag>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Started</span>
            <span className="text-sm font-medium">
              {new Date(inspection.startedAt).toLocaleString()}
            </span>
          </div>
          {inspection.submittedAt && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Submitted</span>
                <span className="text-sm font-medium">
                  {new Date(inspection.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Duration</span>
                <span className="text-sm font-medium">
                  {Math.floor(duration / 60)}m {duration % 60}s
                </span>
              </div>
            </>
          )}
        </div>

        {/* Answers */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Checklist Items</h2>
          {Object.entries(inspection.answers).map(([key, answer]) => (
            <div key={key} className="bg-white rounded-card shadow-card p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">
                    {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  {answer.note && (
                    <p className="text-sm text-slate-600 mt-2">{answer.note}</p>
                  )}
                </div>
                <Tag kind={answer.status}>{answer.status.toUpperCase()}</Tag>
              </div>
              {answer.photos && answer.photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {answer.photos.map((photo: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(answer.photos!, idx)}
                      className="aspect-square bg-slate-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all cursor-zoom-in group relative"
                    >
                      {typeof photo === 'string' && (photo.startsWith('data:') || photo.startsWith('http')) ? (
                        <>
                          <img src={photo} alt={`Inspection photo ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-2xl">ðŸ”</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          Photo
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Signature */}
        {inspection.signature && (
          <div className="bg-white rounded-card shadow-card p-4">
            <h3 className="font-medium text-slate-900 mb-3">Operator Signature</h3>
            <div className="border-2 border-slate-200 rounded-lg p-2">
              <img src={inspection.signature} alt="Signature" className="w-full h-32 object-contain" />
            </div>
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {isLightboxOpen && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}

