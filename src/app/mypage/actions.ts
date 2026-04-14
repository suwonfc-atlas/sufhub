"use server";

import { revalidatePath } from "next/cache";

import { clearUserSession, hashPassword, verifyPassword } from "@/lib/auth/user";
import { getUserFromSession } from "@/lib/auth/user";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { UserAccount } from "@/types";

export interface ProfileUpdateResult {
  status: "success" | "error";
  message: string;
}

function success(message: string): ProfileUpdateResult {
  return { status: "success", message };
}

function failure(message: string): ProfileUpdateResult {
  return { status: "error", message };
}

function normalize(value: string) {
  return value.trim();
}

function isValidEmail(value: string) {
  return value.includes("@") && value.includes(".");
}

function getAuthSupabase() {
  return createServiceSupabaseClient() ?? createPublicSupabaseClient();
}

type SessionUser = UserAccount & { password_hash?: string | null };

export async function updateUserProfile(input: {
  nickname: string;
  email: string;
}): Promise<ProfileUpdateResult> {
  const user = (await getUserFromSession()) as SessionUser | null;
  if (!user) {
    return failure("로그인이 필요합니다.");
  }

  const supabase = getAuthSupabase();
  if (!supabase) {
    return failure("서버 설정이 올바르지 않습니다.");
  }

  const nickname = normalize(input.nickname);
  const email = normalize(input.email);

  if (!nickname || nickname.length < 2) {
    return failure("닉네임은 2자 이상 입력해 주세요.");
  }

  if (!email || !isValidEmail(email)) {
    return failure("이메일 형식을 확인해 주세요.");
  }

  if (nickname !== user.nickname) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("nickname", nickname)
      .limit(1)
      .maybeSingle();
    if (data) {
      return failure("이미 사용 중인 닉네임입니다.");
    }
  }

  if (email !== user.email) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (data) {
      return failure("이미 사용 중인 이메일입니다.");
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ nickname, email })
    .eq("id", user.id);

  if (error) {
    return failure(error.message);
  }

  revalidatePath("/mypage");
  revalidatePath("/api/auth/me");
  return success("회원 정보를 수정했습니다.");
}

export async function updateUserPassword(input: {
  current_password: string;
  next_password: string;
  next_password_confirm: string;
}): Promise<ProfileUpdateResult> {
  const user = (await getUserFromSession()) as SessionUser | null;
  if (!user) {
    return failure("로그인이 필요합니다.");
  }

  const supabase = getAuthSupabase();
  if (!supabase) {
    return failure("서버 설정이 올바르지 않습니다.");
  }

  const currentPassword = normalize(input.current_password);
  const nextPassword = normalize(input.next_password);
  const nextPasswordConfirm = normalize(input.next_password_confirm);

  if (!currentPassword || !nextPassword) {
    return failure("비밀번호를 모두 입력해 주세요.");
  }

  if (nextPassword.length < 8) {
    return failure("새 비밀번호는 8자 이상이어야 합니다.");
  }

  if (nextPassword !== nextPasswordConfirm) {
    return failure("새 비밀번호 확인이 일치하지 않습니다.");
  }

  if (!verifyPassword(currentPassword, user.password_hash ?? "")) {
    return failure("현재 비밀번호가 올바르지 않습니다.");
  }

  const { error } = await supabase
    .from("users")
    .update({ password_hash: hashPassword(nextPassword) })
    .eq("id", user.id);

  if (error) {
    return failure(error.message);
  }

  return success("비밀번호를 변경했습니다.");
}

export async function deleteUserAccount(input: { password: string }): Promise<ProfileUpdateResult> {
  const user = (await getUserFromSession()) as SessionUser | null;
  if (!user) {
    return failure("로그인이 필요합니다.");
  }

  const supabase = getAuthSupabase();
  if (!supabase) {
    return failure("서버 설정이 올바르지 않습니다.");
  }

  const password = normalize(input.password);
  if (!password) {
    return failure("비밀번호를 입력해 주세요.");
  }

  if (!verifyPassword(password, user.password_hash ?? "")) {
    return failure("비밀번호가 올바르지 않습니다.");
  }

  const { error } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", user.id);

  if (error) {
    return failure(error.message);
  }

  await supabase.from("user_sessions").delete().eq("user_id", user.id);
  await clearUserSession();

  return success("회원 탈퇴가 완료되었습니다.");
}
