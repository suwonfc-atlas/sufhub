import { cn } from "@/lib/utils";

interface AdminSectionTab {
  key: string;
  label: string;
}

export function AdminSectionTabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: AdminSectionTab[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap items-start content-start self-start gap-2">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-sm font-semibold leading-none transition",
              active
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
