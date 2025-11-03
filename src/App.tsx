import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import type { ComponentType } from "react";
import ChecklistRunner from "./components/ChecklistRunner";
import SupervisorHub from "./pages/SupervisorHub";
import JsaManagement from "./pages/JsaManagement";
import History from "./pages/History";
import InspectionDetail from "./pages/InspectionDetail";
import JsaList from "./pages/JsaList";
import JsaDetail from "./pages/JsaDetail";
import SopAcknowledgmentHistory from "./pages/SopAcknowledgmentHistory";
import Dashboard from "./pages/Dashboard";
import InspectPage from "./pages/InspectPage";
import SopLibraryPage from "./pages/SopLibraryPage";
import More from "./pages/More";
import Login from "./pages/Login";
import BottomNav from "./components/BottomNav";
import TimeClock from "./pages/TimeClock";
import PersonnelDashboard from "./pages/PersonnelDashboard";
import TimeHistory from "./pages/TimeHistory";
import JobSites from "./pages/JobSites";
import SupervisorAlerts from "./pages/SupervisorAlerts";
import SitePersonnelHistory from "./pages/SitePersonnelHistory";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import DailyReportCreate from "./pages/DailyReportCreate";
import DailyReports from "./pages/DailyReports";
import Documents from "./pages/Documents";
import ActiveSessionBanner from "./components/ActiveSessionBanner";
import SopAcknowledgmentModal from "./components/SopAcknowledgmentModal";
import AuthGuard from "./components/AuthGuard";
import { useToast } from "./hooks/useToast";
import FAB from "./components/ui/FAB";
import { HomeIcon, DozerIcon, LoaderIcon, ExcavatorIcon, TractorIcon } from "./components/icons";
import Header from "./components/ui/Header";
import Button from "./components/ui/Button";
import { JobSiteFilterProvider } from "./context/JobSiteFilterContext";
import RequireSupervisor from "./components/RequireSupervisor";
import RequireEmployee from "./components/RequireEmployee";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import { hasAcknowledgedAllRequired } from "./services/sopAcknowledgment";
import { ref, get } from "firebase/database";
import { rtdb } from "./firebase";
import SafetyHub from "./pages/SafetyHub";
import { useUserRole } from "./hooks/useUserRole";

type Equip = "dozer"|"loader"|"farm_tractor"|"excavator";

const RECENT_STORAGE_KEY = "inspection-v2-recent";

const equipmentOptions: { value: Equip; label: string; icon: ComponentType<{ className?: string; size?: number }>; description: string }[] = [
  { value: "dozer", label: "Dozer", icon: DozerIcon, description: "Push soil, grade pads, prep job sites." },
  { value: "loader", label: "Loader", icon: LoaderIcon, description: "Move aggregate and stockpiles quickly." },
  { value: "excavator", label: "Excavator", icon: ExcavatorIcon, description: "Dig, trench, and handle heavy lifts." },
  { value: "farm_tractor", label: "Farm Tractor", icon: TractorIcon, description: "Tow, till, and support farm implements." },
];

const equipmentLookup: Record<Equip, { label: string; icon: ComponentType<{ className?: string; size?: number }>; description: string }> = equipmentOptions.reduce((acc, option) => {
  acc[option.value] = { label: option.label, icon: option.icon, description: option.description };
  return acc;
}, {} as Record<Equip, { label: string; icon: ComponentType<{ className?: string; size?: number }>; description: string }>);

type PreInfoProps = {
  equipType: Equip;
  equipId: string;
  hours: string;
  onChange: (field: "equipId" | "hours", value: string) => void;
  onNext: (id: string, hours: string) => void;
};

type SopDocument = {
  id: string;
  name: string;
  url: string;
  storagePath: string;
};

type Sop = {
  id: string;
  title: string;
  description?: string;
  category: string;
  documents: SopDocument[];
};

function PreInfo({ equipType, equipId, hours, onChange, onNext }: PreInfoProps){
  const [errors, setErrors] = useState<{ equipId?: string; hours?: string }>({});
  const [checking, setChecking] = useState(false);
  const [showSopModal, setShowSopModal] = useState(false);
  const [requiredSops, setRequiredSops] = useState<Sop[]>([]);
  const [pendingNext, setPendingNext] = useState<{ id: string; hours: string } | null>(null);
  const toast = useToast();
  const equipInfo = equipmentLookup[equipType];

  const handleSubmit = async () => {
    const trimmedId = equipId.trim();
    const trimmedHours = hours.trim();
    const nextErrors: { equipId?: string; hours?: string } = {};

    if (!trimmedId) {
      nextErrors.equipId = "Add the asset ID before proceeding.";
    }

    if (!trimmedHours) {
      nextErrors.hours = "Enter the current hour meter reading.";
    } else if (!/^\d+$/.test(trimmedHours)) {
      nextErrors.hours = "Use digits only.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      toast.warning("Check the highlighted fields.");
      return;
    }

    setErrors({});
    setChecking(true);

    try {
      // Check if there are required SOPs for this equipment type
      const { allAcknowledged, missingSops } = await hasAcknowledgedAllRequired(equipType);

      if (!allAcknowledged && missingSops.length > 0) {
        // Load the missing SOPs
        const sopsRef = ref(rtdb, "/v2/sops");
        const snapshot = await get(sopsRef);

        if (snapshot.exists()) {
          const allSops = snapshot.val();
          const missingData: Sop[] = missingSops
            .map(sopId => {
              const sopData = allSops[sopId];
              if (sopData) {
                return { id: sopId, ...sopData };
              }
              return null;
            })
            .filter((sop): sop is Sop => sop !== null);

          if (missingData.length > 0) {
            setRequiredSops(missingData);
            setPendingNext({ id: trimmedId, hours: trimmedHours });
            setShowSopModal(true);
            setChecking(false);
            return;
          }
        }
      }

      // No SOPs required or all acknowledged, proceed
      onNext(trimmedId, trimmedHours);
    } catch (error) {
      console.error("Error checking SOPs:", error);
      toast.error("Failed to check required SOPs. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleSopComplete = () => {
    setShowSopModal(false);
    toast.success("All required SOPs acknowledged!");
    if (pendingNext) {
      onNext(pendingNext.id, pendingNext.hours);
      setPendingNext(null);
    }
  };

  const handleSopCancel = () => {
    setShowSopModal(false);
    setPendingNext(null);
    toast.warning("You must acknowledge all required SOPs before starting inspection");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Equipment Details"
        subtitle={
          <span className="inline-flex items-center gap-3">
            {equipInfo && <equipInfo.icon className="text-orange-400" size={28} />}
            <span className="text-navy-200 text-sm font-medium">{equipInfo?.label}</span>
          </span>
        }
      />

      <div className="mx-auto max-w-lg p-4">
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-card">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Equipment ID <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                value={equipId}
                onChange={e => {
                  onChange("equipId", e.target.value);
                  if (errors.equipId) setErrors(prev => ({ ...prev, equipId: undefined }));
                }}
                placeholder="e.g. D-123"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                aria-invalid={Boolean(errors.equipId)}
                className={`w-full rounded-xl border-2 p-4 text-lg shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 ${errors.equipId ? "border-error" : "border-slate-200"}`}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Enter the equipment identification number</p>
            {errors.equipId && <p className="mt-2 text-xs font-semibold text-error">{errors.equipId}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Hour Meter Reading <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={hours}
                onChange={e => {
                  onChange("hours", e.target.value);
                  if (errors.hours) setErrors(prev => ({ ...prev, hours: undefined }));
                }}
                placeholder="0000"
                aria-invalid={Boolean(errors.hours)}
                className={`w-full rounded-xl border-2 p-4 text-lg shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 ${errors.hours ? "border-error" : "border-slate-200"}`}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Current hour meter reading from the equipment</p>
            {errors.hours && <p className="mt-2 text-xs font-semibold text-error">{errors.hours}</p>}
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg" loading={checking} disabled={checking}>
            {checking ? "Checking requirements..." : "Start Inspection â†’"}
          </Button>
        </div>
      </div>

      {/* SOP Acknowledgment Modal */}
      {showSopModal && (
        <SopAcknowledgmentModal
          sops={requiredSops}
          equipmentType={equipType}
          onComplete={handleSopComplete}
          onCancel={handleSopCancel}
        />
      )}
    </div>
  );
}

export default function App(){
  const nav = useNavigate();
  const location = useLocation();
  const { isSupervisor } = useUserRole();
  const [equipType, setEquipType] = useState<Equip>("dozer");
  const [equipId, setEquipId] = useState("");
  const [hours, setHours] = useState("");

  // Load equipment data from sessionStorage when navigating to /pre
  useEffect(() => {
    const storedType = sessionStorage.getItem("inspection-equipment-type");
    const storedId = sessionStorage.getItem("inspection-equipment-id");
    const storedHours = sessionStorage.getItem("inspection-equipment-hours");

    if (storedType) setEquipType(storedType as Equip);
    if (storedId) setEquipId(storedId);
    if (storedHours) setHours(storedHours);
  }, []);

  const rememberEquipment = useCallback((entry: { type: Equip; equipmentId: string; hours: string }) => {
    try {
      const stored = window.localStorage.getItem(RECENT_STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      const nextEntry = {
        type: entry.type,
        equipmentId: entry.equipmentId,
        hours: entry.hours,
        lastUsedAt: Date.now(),
      };
      const deduped = existing.filter((p: { type: string; equipmentId: string }) => !(p.type === nextEntry.type && p.equipmentId.toLowerCase() === nextEntry.equipmentId.toLowerCase()));
      const next = [nextEntry, ...deduped].slice(0, 5);
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed to persist recent equipment", err);
    }
  }, []);

  return (
    <JobSiteFilterProvider>
      <div className="min-h-screen bg-slate-50">
        <ActiveSessionBanner />
        <div className="mx-auto max-w-md relative">
          <Routes>
            {/* Public route - Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={<AuthGuard><RoleBasedRedirect /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><RequireEmployee><Dashboard /></RequireEmployee></AuthGuard>} />
            <Route path="/inspect" element={<AuthGuard><InspectPage /></AuthGuard>} />
            <Route path="/library" element={<Navigate to="/jsa" replace />} />
            <Route path="/library/jsas" element={<Navigate to="/jsa" replace />} />
            <Route path="/library/sops" element={<Navigate to="/sops" replace />} />
            <Route path="/supervisor" element={<Navigate to="/supervisor-hub" replace />} />
            <Route path="/supervisor/jsas" element={<Navigate to="/jsa/manage" replace />} />
            <Route path="/sop/history" element={<Navigate to="/sops/acknowledgments" replace />} />
            <Route path="/more" element={<AuthGuard><More /></AuthGuard>} />
            <Route path="/reports/new" element={<AuthGuard><DailyReportCreate /></AuthGuard>} />
            <Route
              path="/pre"
              element={
                <AuthGuard>
                  <PreInfo
                    equipType={equipType}
                    equipId={equipId}
                    hours={hours}
                    onChange={(field, value) => {
                      if (field === "equipId") setEquipId(value);
                      if (field === "hours") setHours(value);
                    }}
                    onNext={(id, hrs) => {
                      setEquipId(id);
                      setHours(hrs);
                      rememberEquipment({ type: equipType, equipmentId: id, hours: hrs });
                      nav("/run");
                    }}
                  />
                </AuthGuard>
              }
            />
            <Route path="/run" element={<AuthGuard><ChecklistRunner equipType={equipType} equipId={equipId} hours={hours} /></AuthGuard>} />
            <Route path="/jsa" element={<AuthGuard><JsaList /></AuthGuard>} />
            <Route path="/jsa/:id" element={<AuthGuard><JsaDetail /></AuthGuard>} />
            <Route
              path="/supervisor-hub"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Supervisor Hub">
                    <SupervisorHub />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/safety"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Safety Hub">
                    <SafetyHub />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/sops"
              element={<AuthGuard><SopLibraryPage /></AuthGuard>}
            />
            <Route
              path="/sops/acknowledgments"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="SOP Acknowledgment History">
                    <SopAcknowledgmentHistory />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/jsa/manage"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="JSA Management">
                    <JsaManagement />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/history"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Inspection History">
                    <History />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route path="/inspection/:id" element={<AuthGuard><InspectionDetail /></AuthGuard>} />
            {/* Time Tracking Routes */}
            <Route path="/time-clock" element={<AuthGuard><TimeClock /></AuthGuard>} />
            <Route
              path="/personnel"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Personnel Dashboard">
                    <PersonnelDashboard />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route path="/time-history" element={<AuthGuard><TimeHistory /></AuthGuard>} />
            <Route
              path="/job-sites"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Job Site Management">
                    <JobSites />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/job-sites/:siteId/history"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Job Site Personnel History">
                    <SitePersonnelHistory />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/supervisor-alerts"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Supervisor Alerts">
                    <SupervisorAlerts />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/reports"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Daily Reports">
                    <DailyReports />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            <Route
              path="/documents"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="Documents">
                    <Documents />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
            {/* User Management Routes */}
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
            <Route
              path="/users"
              element={
                <AuthGuard>
                  <RequireSupervisor feature="User Management">
                    <UserManagement />
                  </RequireSupervisor>
                </AuthGuard>
              }
            />
          </Routes>
          {isSupervisor &&
            location.pathname !== "/login" &&
            location.pathname !== "/supervisor-hub" &&
            !location.pathname.includes("/pre") &&
            !location.pathname.includes("/run") && (
              <FAB
                onClick={() => nav("/supervisor-hub")}
                icon={<HomeIcon />}
                ariaLabel="Go to Supervisor Hub"
              />
            )}
          <BottomNav />
        </div>
      </div>
    </JobSiteFilterProvider>
  );
}

