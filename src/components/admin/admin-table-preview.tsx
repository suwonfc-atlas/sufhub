import { SurfaceCard } from "@/components/ui/surface-card";

interface AdminTablePreviewProps {
  title: string;
  description: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

export function AdminTablePreview({
  title,
  description,
  columns,
  rows,
}: AdminTablePreviewProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-950 text-sm text-white">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100 text-sm text-slate-700">
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-4">
                    {cell ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
