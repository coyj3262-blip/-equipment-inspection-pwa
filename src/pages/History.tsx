import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { rtdb } from "../firebase";
import Header from "../components/ui/Header";
import Tag from "../components/ui/Tag";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import { CheckIcon } from "../components/icons";
import { onValue, ref, query, orderByChild, limitToLast } from "firebase/database";
import type { Inspection as InspectionType } from "../backend.rtdb";
import { useJobSiteFilter } from "../context/JobSiteFilterContext";

type Inspection = InspectionType & {
  id: string;
};

export default function History() {
  const navigate = useNavigate();
  const { selectedSiteId } = useJobSiteFilter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Get last 50 inspections
    const inspRef = ref(rtdb, "/v2/inspections");
    const recentQuery = query(inspRef, orderByChild("submittedAt"), limitToLast(50));

    const unsubscribe = onValue(recentQuery, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLoading(false);
        return;
      }

      const inspList: Inspection[] = Object.entries(data).map(([id, insp]) => ({
        id,
        ...(insp as InspectionType)
      }));

      // Sort newest first
      inspList.sort((a, b) => (b.submittedAt || b.startedAt) - (a.submittedAt || a.startedAt));
      setInspections(inspList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredInspections = inspections
    .filter(i => filter === "all" || i.equipmentType === filter)
    .filter(i => !selectedSiteId || i.siteId === selectedSiteId);

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Inspection History" subtitle="View past inspections" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" message="Loading inspections..." />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="Inspection History" subtitle="View past inspections" />

      {/* Filters */}
      <div className="p-4 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="flex gap-2 overflow-x-auto max-w-2xl mx-auto">
          {["all", "dozer", "loader", "excavator", "farm_tractor"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`
                px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap
                transition-all
                ${filter === type
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }
              `}
            >
              {type === "all" ? "All" : type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {inspections.length === 0 ? (
          <EmptyState
            icon={<CheckIcon size={64} className="text-slate-300" />}
            title="No inspections yet"
            description="Complete your first equipment inspection to see it here. Inspection history helps track equipment condition over time."
            action={{
              label: "Start New Inspection",
              onClick: () => navigate("/")
            }}
          />
        ) : filteredInspections.length === 0 ? (
          <EmptyState
            icon={<div className="text-6xl">ðŸ”</div>}
            title="No inspections match this filter"
            description={`No ${filter.replace("_", " ")} inspections found. Try selecting a different equipment type.`}
            action={{
              label: "Clear Filter",
              onClick: () => setFilter("all")
            }}
          />
        ) : (
          filteredInspections.map((insp) => (
            <Link
              key={insp.id}
              to={`/inspection/${insp.id}`}
              className="
                block p-5 bg-white rounded-2xl shadow-lg
                hover:shadow-xl transition-all
                border border-slate-100 hover:border-orange-300
                hover:scale-[1.02]
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 capitalize text-lg">
                    {insp.equipmentType.replace("_", " ")}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    ID: {insp.equipmentId}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(insp.submittedAt || insp.startedAt).toLocaleString()}
                  </p>
                </div>
                <Tag kind={insp.state}>
                  {insp.state.replace("_", " ")}
                </Tag>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

