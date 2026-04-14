"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ExperienceRuleInput {
  action: string;
  points: string;
  is_active: boolean;
}

export interface ExperienceRuleResult {
  status: "success" | "error";
  message: string;
}

function success(message: string): ExperienceRuleResult {
  return { status: "success", message };
}

function failure(message: string): ExperienceRuleResult {
  return { status: "error", message };
}

function parseInteger(value: string, label: string) {
  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);

  if (!trimmed || Number.isNaN(parsed)) {
    throw new Error(`${label} 값을 확인해 주세요.`);
  }

  return parsed;
}

export async function saveExperienceRule(
  input: ExperienceRuleInput,
): Promise<ExperienceRuleResult> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return failure("Supabase 연결 정보를 확인해 주세요.");
    }

    const payload = {
      action: input.action,
      points: parseInteger(input.points, "경험치"),
      is_active: input.is_active,
    };

    const { error } = await supabase
      .from("experience_rules")
      .upsert(payload, { onConflict: "action" });

    if (error) return failure(error.message);

    revalidatePath("/admin/experience");
    return success("경험치 규칙을 저장했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "저장에 실패했습니다.");
  }
}

export async function deleteExperienceRule(action: string): Promise<ExperienceRuleResult> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return failure("Supabase 연결 정보를 확인해 주세요.");
    }

    const { error } = await supabase.from("experience_rules").delete().eq("action", action);
    if (error) return failure(error.message);

    revalidatePath("/admin/experience");
    return success("경험치 규칙을 삭제했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "삭제에 실패했습니다.");
  }
}
