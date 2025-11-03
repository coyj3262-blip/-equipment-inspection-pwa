import type { ComponentType } from "react";

type EquipmentTileProps = {
  label: string;
  description?: string;
  onSelect: () => void;
  Icon: ComponentType<{ className?: string; size?: number }>;
};

export default function EquipmentTile({ label, description, onSelect, Icon }: EquipmentTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:ring-4 focus-visible:ring-orange-200"
    >
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 p-4 transition-all group-hover:from-orange-500 group-hover:to-orange-600">
        <Icon className="text-orange-500 transition-all group-hover:text-white" size={64} />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-900">{label}</p>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <span className="absolute right-4 top-4 text-xs font-semibold text-orange-500 opacity-0 transition-opacity group-hover:opacity-100">
        Start →
      </span>
    </button>
  );
}
