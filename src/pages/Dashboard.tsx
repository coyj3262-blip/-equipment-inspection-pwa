import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/ui/Header";
import RecentEquipment, { type RecentEntry } from "../components/RecentEquipment";
import { ClipboardIcon, CheckIcon, ClockIcon, BookIcon } from "../components/icons";
import type { ComponentType } from "react";

type Equip = "dozer"|"loader"|"farm_tractor"|"excavator";

const RECENT_STORAGE_KEY = "inspection-v2-recent";

const equipmentLookup: Record<Equip, { label: string }> = {
  dozer: { label: "Dozer" },
  loader: { label: "Loader" },
  excavator: { label: "Excavator" },
  farm_tractor: { label: "Farm Tractor" },
};

type QuickAction = {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  path: string;
  color: "orange" | "blue" | "green" | "purple";
};

const quickActions: QuickAction[] = [
  {
    label: "Clock In/Out",
    description: "Track your work hours",
    icon: ClockIcon,
    path: "/time-clock",
    color: "orange",
  },
  {
    label: "Start Inspection",
    description: "Begin a new equipment check",
    icon: ClipboardIcon,
    path: "/inspect",
    color: "blue",
  },
  {
    label: "Job Safety Analysis",
    description: "Review and sign JSAs",
    icon: CheckIcon,
    path: "/library?tab=jsas",
    color: "green",
  },
  {
    label: "SOP Library",
    description: "Review field procedures",
    icon: BookIcon,
    path: "/library?tab=sops",
    color: "purple",
  },
];

const colorStyles = {
  orange: "border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100",
  blue: "border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100",
  green: "border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-green-100",
  purple: "border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100",
};

const iconColorStyles = {
  orange: "text-orange-500",
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
};

export default function Dashboard() {
  const [recent, setRecent] = useState<RecentEntry<Equip>[]>([]);

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

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="Dashboard" subtitle="Equipment inspection overview" />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Recent Equipment */}
        {recent.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 px-1">
              Recent Equipment
            </h2>
            <RecentEquipment
              items={recent}
              onSelect={(entry) => {
                // Navigate to pre-inspection with this equipment
                window.location.href = `/pre?type=${entry.type}&id=${entry.equipmentId}&hours=${entry.hours || ""}`;
              }}
              resolveLabel={(type: Equip) => equipmentLookup[type].label}
            />
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 px-1">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className={`
                    flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2
                    transition-all hover:-translate-y-0.5 hover:shadow-lg
                    ${colorStyles[action.color]}
                  `}
                >
                  <Icon className={`${iconColorStyles[action.color]} shrink-0`} size={36} />
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-900">{action.label}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{action.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

