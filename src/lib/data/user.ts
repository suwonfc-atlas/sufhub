import { getUserFromSession } from "@/lib/auth/user";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { Inquiry, UserAccount, UserExperienceLog } from "@/types";

export interface UserDashboardData {
  user: UserAccount | null;
  experienceLogs: UserExperienceLog[];
  inquiries: Inquiry[];
  hasServiceAccess: boolean;
}

export async function getUserDashboardData(): Promise<UserDashboardData> {
  const user = (await getUserFromSession()) as UserAccount | null;
  const supabase = createServiceSupabaseClient();
  const hasServiceAccess = Boolean(supabase);

  if (!user || Array.isArray(user) || !supabase) {
    return {
      user: Array.isArray(user) ? null : user,
      experienceLogs: [],
      inquiries: [],
      hasServiceAccess,
    };
  }

  const [experienceLogsResult, inquiriesResult] = await Promise.all([
    supabase
      .from("user_experience_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("inquiries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    user,
    experienceLogs: (experienceLogsResult.data ?? []) as UserExperienceLog[],
    inquiries: (inquiriesResult.data ?? []) as Inquiry[],
    hasServiceAccess,
  };
}

export async function getUserExperienceLogs(userId: string, limit = 50) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("user_experience_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as UserExperienceLog[];
}

export async function getUserInquiries(userId: string, limit = 50) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("inquiries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Inquiry[];
}
