import { useEffect, useMemo, useState } from "react";
import Header from "../components/ui/Header";
import { subscribeToDailyReports } from "../services/dailyReports";
import type { DailyReport } from "../types/dailyReport";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";
import { useJobSiteFilter } from "../context/JobSiteFilterContext";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function toDayKey(iso: string) {
  return iso.replaceAll("-", "");
}

export default function DailyReports() {
  const { selectedSiteId, setSelectedSiteId, availableSites, isRestricted } = useJobSiteFilter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    const unsub = subscribeToDailyReports((list) => {
      setReports(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const dayKey = toDayKey(date);
    return reports.filter(r => (
      (r.dayKey === dayKey) && (!selectedSiteId || r.siteId === selectedSiteId)
    ));
  }, [reports, date, selectedSiteId]);

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="Daily Reports" subtitle="Supervisor view of site logs" />

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Job Site</label>
              <select
                value={selectedSiteId || ""}
                onChange={e => setSelectedSiteId(e.target.value || null)}
                disabled={isRestricted}
                className={`w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm ${isRestricted ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100'}`}
              >
                {!isRestricted && <option value="">All Sites</option>}
                {availableSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {isRestricted && <p className="text-xs text-slate-500 mt-1">You can only view reports for this job site</p>}
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-xs text-slate-600">{filtered.length} report(s) for this day</p>
            <Link to="/reports/new"><Button size="sm">Create Report</Button></Link>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex items-center justify-center"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 text-center text-sm text-slate-500">No reports match the selected filters.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">{r.date} â€¢ {r.siteName}</div>
                    <div className="font-semibold text-slate-900">{r.createdByName || r.createdBy}</div>
                  </div>
                  <div className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">{r.shiftStart}â€“{r.shiftEnd}{r.totalHours ? ` (${r.totalHours}h)` : ''}</div>
                </div>
                <div className="mt-2 text-sm text-slate-700 line-clamp-3">{r.tasksPerformed}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {r.weather && r.weather.map(w => (
                    <span key={w} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{w}</span>
                  ))}
                  {r.ground && r.ground.map(g => (
                    <span key={g} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{g}</span>
                  ))}
                  {r.jsaCompleted && <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">JSA</span>}
                  {r.toolboxTalk && <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">Toolbox</span>}
                </div>
                {r.incidentsOrNearMisses && (
                  <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">Incident/Near miss noted</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


