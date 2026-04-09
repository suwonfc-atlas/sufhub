import { SurfaceCard } from "@/components/ui/surface-card";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <SurfaceCard className="border-dashed border-sky-200 bg-sky-50/70 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </SurfaceCard>
  );
}
