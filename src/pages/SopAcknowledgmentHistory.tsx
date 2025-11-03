import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import Header from "../components/ui/Header";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import PhotoLightbox from "../components/ui/PhotoLightbox";
import { CheckIcon } from "../components/icons";
import type { SopAcknowledgment } from "../services/sopAcknowledgment";

type AcknowledgmentWithSopId = SopAcknowledgment & {
  id: string;
};

export default function SopAcknowledgmentHistory() {
  const [acknowledgments, setAcknowledgments] = useState<AcknowledgmentWithSopId[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);

  useEffect(() => {
    const eventsRef = ref(rtdb, "/v2/sopAcknowledgmentEvents");
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setAcknowledgments([]);
        setLoading(false);
        return;
      }

      const ackList: AcknowledgmentWithSopId[] = Object.entries(data).map(([id, ack]) => ({
        id,
        ...(ack as SopAcknowledgment),
      }));

      // Sort by timestamp (most recent first)
      ackList.sort((a, b) => b.acknowledgedAt - a.acknowledgedAt);
      setAcknowledgments(ackList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get unique values for filters
  const equipmentTypes = Array.from(new Set(acknowledgments.map(a => a.equipmentType).filter((t): t is string => Boolean(t))));
  const operatorNames = Array.from(new Set(acknowledgments.map(a => a.acknowledgedByName)));

  // Filter acknowledgments
  const filteredAcknowledgments = acknowledgments.filter(ack => {
    // Equipment type filter
    if (filter !== "all" && ack.equipmentType !== filter) {
      return false;
    }

    // Search term filter (matches SOP title or operator name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSop = ack.sopTitle.toLowerCase().includes(term);
      const matchesOperator = ack.acknowledgedByName.toLowerCase().includes(term);
      if (!matchesSop && !matchesOperator) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="SOP Acknowledgments" subtitle="Compliance tracking" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" message="Loading acknowledgments..." />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="SOP Acknowledgments"
        subtitle={`${acknowledgments.length} total acknowledgments`}
      />

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SOP title or operator name..."
            className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none"
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap capitalize transition-all ${
                filter === "all"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Equipment ({acknowledgments.length})
            </button>
            {equipmentTypes.map((type) => {
              const count = acknowledgments.filter(a => a.equipmentType === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap capitalize transition-all ${
                    filter === type
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {type?.replace("_", " ")} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-2xl font-bold text-orange-500">{acknowledgments.length}</div>
            <div className="text-xs text-slate-600 font-medium">Total Acknowledgments</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-2xl font-bold text-blue-500">{operatorNames.length}</div>
            <div className="text-xs text-slate-600 font-medium">Unique Operators</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-2xl font-bold text-green-500">
              {Array.from(new Set(acknowledgments.map(a => a.sopId))).length}
            </div>
            <div className="text-xs text-slate-600 font-medium">SOPs Acknowledged</div>
          </div>
        </div>

        {/* Acknowledgments List */}
        {filteredAcknowledgments.length === 0 ? (
          <EmptyState
            icon={<CheckIcon size={64} className="text-slate-300" />}
            title={searchTerm || filter !== "all" ? "No acknowledgments found" : "No acknowledgments yet"}
            description={
              searchTerm || filter !== "all"
                ? "Try adjusting your filters or search term"
                : "Acknowledgments will appear here when operators acknowledge SOPs"
            }
            action={
              searchTerm || filter !== "all"
                ? {
                    label: "Clear Filters",
                    onClick: () => {
                      setSearchTerm("");
                      setFilter("all");
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredAcknowledgments.map((ack) => (
              <div
                key={ack.id}
                className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all border border-slate-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{ack.sopTitle}</h3>
                      {ack.equipmentType && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 capitalize">
                          {ack.equipmentType.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Operator:</span>
                        <span className="text-slate-600">{ack.acknowledgedByName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Date:</span>
                        <span className="text-slate-600">
                          {new Date(ack.acknowledgedAt).toLocaleString()}
                        </span>
                      </div>
                      {ack.notes && (
                        <div className="flex items-start gap-2 text-sm mt-2">
                          <span className="font-medium text-slate-700">Notes:</span>
                          <span className="text-slate-600 italic">{ack.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {ack.signature && (
                    <button
                      onClick={() => setSelectedSignature(ack.signature!)}
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      âœï¸ View Signature
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show count of filtered results */}
        {filteredAcknowledgments.length > 0 && filteredAcknowledgments.length !== acknowledgments.length && (
          <div className="text-center text-sm text-slate-500">
            Showing {filteredAcknowledgments.length} of {acknowledgments.length} acknowledgments
          </div>
        )}
      </div>

      {/* Signature Lightbox */}
      {selectedSignature && (
        <PhotoLightbox
          photos={[selectedSignature]}
          initialIndex={0}
          onClose={() => setSelectedSignature(null)}
        />
      )}
    </div>
  );
}

