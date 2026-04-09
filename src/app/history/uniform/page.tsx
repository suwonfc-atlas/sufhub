import { UniformFilterBoard } from "@/components/history/uniform-filter-board";
import { EmptyState } from "@/components/ui/empty-state";
import { PageIntro } from "@/components/ui/page-intro";
import { getUniforms } from "@/lib/data/public";
import type { UniformType } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "유니폼 갤러리",
  description: "시즌별 수원FC 유니폼을 한 번에 비교합니다.",
};

interface HistoryUniformPageProps {
  searchParams?: Promise<{
    season?: string;
    type?: string;
  }>;
}

const validTypes = new Set<UniformType | "all">([
  "all",
  "home",
  "away",
  "gk-home",
  "gk-away",
  "special",
  "special-2",
]);

export default async function HistoryUniformPage({ searchParams }: HistoryUniformPageProps) {
  const params = (await searchParams) ?? {};
  const type = validTypes.has((params.type ?? "all") as UniformType | "all")
    ? ((params.type ?? "all") as UniformType | "all")
    : "all";

  const { seasons, selectedSeason, selectedType, uniforms } = await getUniforms({
    season: params.season,
    type,
  });

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Uniform Archive"
        title="시즌별 유니폼을 모았습니다."
        description="시즌과 타입을 선택해 유니폼 히스토리를 확인하세요."
      />

      {seasons.length ? (
        <UniformFilterBoard
          seasons={seasons}
          selectedSeason={selectedSeason}
          selectedType={selectedType}
          uniforms={uniforms}
        />
      ) : (
        <EmptyState
          title="등록된 유니폼이 없습니다"
          description="시즌과 유니폼 데이터가 들어오면 여기에서 바로 확인할 수 있습니다."
        />
      )}
    </div>
  );
}
