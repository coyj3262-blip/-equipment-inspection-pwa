import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import type { ComponentType } from "react";
import Header from "../components/ui/Header";
import EquipmentTile from "../components/EquipmentTile";
import RecentEquipment, { type RecentEntry } from "../components/RecentEquipment";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { DozerIcon, LoaderIcon, ExcavatorIcon, TractorIcon } from "../components/icons";

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

export default function InspectPage() {
  const nav = useNavigate();
  const [recent, setRecent] = useState<RecentEntry<Equip>[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as RecentEntry<Equip>[];
      if (Array.isArray(parsed)) {
        setRecent(parsed.filter(item => item?.type && item?.equipmentId));
      }
    } catch (err) {
      console.warn("Failed to load recent equipment", err);
    }
  }, []);

  const handleClearRecent = useCallback(() => {
    setRecent([]);
    setShowClearConfirm(false);
    try {
      window.localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to clear recent equipment", err);
    }
  }, []);

  const handlePick = useCallback((type: Equip) => {
    // Store equipment type in session/state and navigate to pre-inspection
    sessionStorage.setItem("inspection-equipment-type", type);
    nav("/pre");
  }, [nav]);

  const handleRecentSelect = useCallback((entry: RecentEntry<Equip>) => {
    sessionStorage.setItem("inspection-equipment-type", entry.type);
    sessionStorage.setItem("inspection-equipment-id", entry.equipmentId);
    sessionStorage.setItem("inspection-equipment-hours", entry.hours || "");
    nav("/pre");
  }, [nav]);

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="Start Inspection" subtitle="Select equipment to inspect" />

      <RecentEquipment
        items={recent}
        onSelect={handleRecentSelect}
        onClear={recent.length ? () => setShowClearConfirm(true) : undefined}
        resolveLabel={(type: Equip) => equipmentLookup[type].label}
      />

      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Select Equipment Type</h2>
          <p className="text-xs text-slate-500">Pick equipment to launch a new inspection.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {equipmentOptions.map(eq => (
            <EquipmentTile
              key={eq.value}
              label={eq.label}
              description={eq.description}
              Icon={eq.icon}
              onSelect={() => handlePick(eq.value)}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Recent Equipment?"
        message={`This will remove all ${recent.length} recent equipment entries from your history. This cannot be undone.`}
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleClearRecent}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

