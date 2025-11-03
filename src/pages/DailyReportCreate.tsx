import { useEffect, useMemo, useState } from "react";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import SignaturePad from "../components/SignaturePad";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useJobSiteFilter } from "../context/JobSiteFilterContext";
import { createDailyReport } from "../services/dailyReports";
import type { GroundCondition, WeatherCondition } from "../types/dailyReport";
import { useUserRole } from "../hooks/useUserRole";

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

export default function DailyReportCreate() {
  const nav = useNavigate();
  const toast = useToast();
  const { isSupervisor } = useUserRole();
  const { selectedSiteId, availableSites, isRestricted } = useJobSiteFilter();

  const [date, setDate] = useState(todayISO());
  const [siteId, setSiteId] = useState<string | "">(selectedSiteId || "");
  const [shiftStart, setShiftStart] = useState("07:00");
  const [shiftEnd, setShiftEnd] = useState("15:30");
  const [crewCount, setCrewCount] = useState<number | "">("");
  const [crewNotes, setCrewNotes] = useState("");
  const [weather, setWeather] = useState<WeatherCondition[]>([]);
  const [temperatureF, setTemperatureF] = useState<number | "">("");
  const [ground, setGround] = useState<GroundCondition[]>([]);
  const [tasksPerformed, setTasksPerformed] = useState("");
  const [equipmentUsed, setEquipmentUsed] = useState("");
  const [hazardsObserved, setHazardsObserved] = useState("");
  const [incidentsOrNearMisses, setIncidentsOrNearMisses] = useState("");
  const [materials, setMaterials] = useState("");
  const [jsaCompleted, setJsaCompleted] = useState(false);
  const [toolboxTalk, setToolboxTalk] = useState(false);
  const [toolboxTopic, setToolboxTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isRestricted && selectedSiteId) setSiteId(selectedSiteId);
  }, [isRestricted, selectedSiteId]);

  const siteName = useMemo(() => {
    const s = availableSites.find(s => s.id === siteId);
    return s?.name || "";
  }, [availableSites, siteId]);

  const availableWeather: WeatherCondition[] = ["Clear", "Cloudy", "Rain", "Snow", "Windy", "Hot", "Cold"];
  const availableGround: GroundCondition[] = ["Dry", "Damp", "Muddy", "Frozen", "Icy"];

  const toggleInArray = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const calcTotalHours = useMemo(() => {
    try {
      const [sH, sM] = shiftStart.split(":").map(Number);
      const [eH, eM] = shiftEnd.split(":").map(Number);
      const s = sH * 60 + sM;
      const e = eH * 60 + eM;
      const diff = e - s;
      if (isNaN(diff) || diff <= 0) return undefined;
      return Math.round((diff / 60) * 10) / 10;
    } catch { return undefined; }
  }, [shiftStart, shiftEnd]);

  async function handleSubmit() {
    // Basic validation
    if (!date) return toast.warning("Select the report date.");
    if (!siteId) return toast.warning("Select the job site.");
    if (!tasksPerformed.trim()) return toast.warning("Add a summary of work performed.");
    if (!signatureDataUrl) return toast.warning("Please add your signature.");

    setSubmitting(true);
    try {
      await createDailyReport({
        date,
        dayKey: toDayKey(date),
        siteId,
        siteName,
        shiftStart,
        shiftEnd,
        totalHours: calcTotalHours,
        crewCount: crewCount === "" ? undefined : Number(crewCount),
        crewNotes: crewNotes.trim() || undefined,
        weather: weather.length ? weather : undefined,
        temperatureF: temperatureF === "" ? undefined : Number(temperatureF),
        ground: ground.length ? ground : undefined,
        tasksPerformed: tasksPerformed.trim(),
        equipmentUsed: equipmentUsed.trim() || undefined,
        hazardsObserved: hazardsObserved.trim() || undefined,
        incidentsOrNearMisses: incidentsOrNearMisses.trim() || undefined,
        materials: materials.trim() || undefined,
        jsaCompleted: jsaCompleted || undefined,
        toolboxTalk: toolboxTalk || undefined,
        toolboxTopic: toolboxTalk ? (toolboxTopic.trim() || undefined) : undefined,
        notes: notes.trim() || undefined,
        signatureDataUrl,
      });
      toast.success("Daily report submitted");
      // Navigate: supervisors â†’ reports list; employees â†’ dashboard
      nav(isSupervisor ? "/reports" : "/dashboard");
    } catch (err) {
      console.error("Failed to save daily report", err);
      toast.error("Could not save report. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="Daily Report" subtitle="Capture today's site activity" />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Date and Site */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Job Site</label>
              <select
                value={siteId}
                onChange={e => setSiteId(e.target.value)}
                disabled={isRestricted}
                className={`w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm ${isRestricted ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100'}`}
              >
                {!isRestricted && <option value="">Select a site</option>}
                {availableSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {isRestricted && <p className="text-xs text-slate-500 mt-1">You can only submit for your assigned site</p>}
            </div>
          </div>
        </div>

        {/* Shift & Crew */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Shift & Crew</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Start</label>
              <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">End</label>
              <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Crew Count</label>
              <input inputMode="numeric" pattern="[0-9]*" value={crewCount} onChange={e => setCrewCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 4" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Total Hours</label>
              <input readOnly value={calcTotalHours ?? ''} placeholder="auto" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm bg-slate-50 text-slate-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Crew Notes</label>
            <textarea value={crewNotes} onChange={e => setCrewNotes(e.target.value)} rows={2} placeholder="Names or roles of crew members on site" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Site Conditions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Weather</label>
              <div className="flex flex-wrap gap-2">
                {availableWeather.map(w => (
                  <button key={w} type="button" onClick={() => setWeather(prev => toggleInArray(prev, w))} className={`px-3 py-1 rounded-lg border text-xs font-semibold ${weather.includes(w) ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-slate-200 text-slate-700'}`}>{w}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Temperature (Â°F)</label>
              <input inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 72" value={temperatureF} onChange={e => setTemperatureF(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Ground</label>
            <div className="flex flex-wrap gap-2">
              {availableGround.map(g => (
                <button key={g} type="button" onClick={() => setGround(prev => toggleInArray(prev, g))} className={`px-3 py-1 rounded-lg border text-xs font-semibold ${ground.includes(g) ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-slate-200 text-slate-700'}`}>{g}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Work Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Work Summary</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Tasks Performed *</label>
              <textarea rows={4} value={tasksPerformed} onChange={e => setTasksPerformed(e.target.value)} placeholder="Brief summary of activities, locations, quantities, progress milestones" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Equipment Used</label>
              <textarea rows={2} value={equipmentUsed} onChange={e => setEquipmentUsed(e.target.value)} placeholder="e.g. Excavator 320, Loader L-12, Truck #7" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Materials Delivered/Removed</label>
              <textarea rows={2} value={materials} onChange={e => setMaterials(e.target.value)} placeholder="e.g. 40yd gravel delivered, 2 loads spoil hauled" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
          </div>
        </div>

        {/* Safety */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Safety</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Hazards Observed</label>
              <textarea rows={2} value={hazardsObserved} onChange={e => setHazardsObserved(e.target.value)} placeholder="Note any hazards and controls applied" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Incidents or Near Misses</label>
              <textarea rows={2} value={incidentsOrNearMisses} onChange={e => setIncidentsOrNearMisses(e.target.value)} placeholder="Describe any incident, injury, property damage, or near miss" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={jsaCompleted} onChange={e => setJsaCompleted(e.target.checked)} /> JSA Completed
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={toolboxTalk} onChange={e => setToolboxTalk(e.target.checked)} /> Toolbox Talk
              </label>
            </div>
            {toolboxTalk && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Toolbox Topic</label>
                <input value={toolboxTopic} onChange={e => setToolboxTopic(e.target.value)} placeholder="Topic covered" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
              </div>
            )}
          </div>
        </div>

        {/* Notes & Signature */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Additional Notes</label>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else supervisors should know" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100" />
            </div>
            <div>
              <SignaturePad onSignature={setSignatureDataUrl} label="Submitter Signature *" />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full mt-4" size="lg" loading={submitting} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}


