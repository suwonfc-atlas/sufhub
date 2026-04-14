import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export type ExperienceAction = "prediction_vote" | "prediction_hit";

export interface ExperienceApplyResult {
  applied: boolean;
  points: number;
}

function getSupabase() {
  return createServiceSupabaseClient();
}

export async function applyExperienceReward(params: {
  userId: string;
  action: ExperienceAction;
  referenceId?: string | null;
  reason: string;
}): Promise<ExperienceApplyResult> {
  const supabase = getSupabase();
  if (!supabase) return { applied: false, points: 0 };

  const { data: rule } = await supabase
    .from("experience_rules")
    .select("action, points, is_active")
    .eq("action", params.action)
    .maybeSingle();

  if (!rule || !rule.is_active || rule.points === 0) {
    return { applied: false, points: 0 };
  }

  if (params.referenceId) {
    const { data: existing } = await supabase
      .from("user_experience_logs")
      .select("id")
      .eq("user_id", params.userId)
      .eq("action", params.action)
      .eq("reference_id", params.referenceId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { applied: false, points: rule.points };
    }
  }

  const { data: user } = await supabase
    .from("users")
    .select("experience")
    .eq("id", params.userId)
    .maybeSingle();

  const nextTotal = (user?.experience ?? 0) + rule.points;

  await supabase
    .from("users")
    .update({ experience: nextTotal })
    .eq("id", params.userId);

  await supabase.from("user_experience_logs").insert({
    user_id: params.userId,
    delta: rule.points,
    total_experience: nextTotal,
    reason: params.reason,
    action: params.action,
    reference_id: params.referenceId ?? null,
  });

  return { applied: true, points: rule.points };
}
