export type RecentEntry<TType extends string = string> = {
  type: TType;
  equipmentId: string;
  hours?: string;
  lastUsedAt: number;
};

type RecentEquipmentProps<TType extends string> = {
  items: RecentEntry<TType>[];
  onSelect: (entry: RecentEntry<TType>) => void;
  onClear?: () => void;
  resolveLabel: (type: TType) => string;
};

export default function RecentEquipment<TType extends string>({ items, onSelect, onClear, resolveLabel }: RecentEquipmentProps<TType>) {
  if (!items.length) return null;

  return (
    <section className="mx-auto mb-4 max-w-2xl px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent equipment</h2>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-orange-500 hover:text-orange-600"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={`${item.type}-${item.equipmentId}`}
            type="button"
            onClick={() => onSelect(item)}
            className="min-w-[180px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:ring-4 focus-visible:ring-orange-200"
          >
            <p className="text-sm font-semibold text-slate-900">{resolveLabel(item.type)}</p>
            <p className="text-xs text-slate-500">ID: {item.equipmentId}</p>
            {item.hours && <p className="text-[11px] text-slate-400">Last hours: {item.hours}</p>}
          </button>
        ))}
      </div>
    </section>
  );
}
