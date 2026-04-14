"use server";

import { revalidatePath } from "next/cache";

import { getUserFromSession } from "@/lib/auth/user";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { Inquiry, InquiryType } from "@/types";

export interface ContactInquiryInput {
  title: string;
  type: InquiryType;
  content: string;
}

export interface ContactInquiryResult {
  status: "success" | "error";
  message: string;
  inquiry?: Inquiry;
}

function normalizeString(value: string) {
  return value.trim();
}

function success(message: string, inquiry?: Inquiry): ContactInquiryResult {
  return { status: "success", message, inquiry };
}

function failure(message: string): ContactInquiryResult {
  return { status: "error", message };
}

export async function submitInquiry(
  input: ContactInquiryInput,
): Promise<ContactInquiryResult> {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return failure("로그인이 필요합니다.");
    }

    const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
    if (!supabase) {
      return failure("문의 접수를 위한 서버 설정이 아직 연결되지 않았습니다.");
    }

    const senderName = user.nickname || user.username;
    const payload = {
      title: normalizeString(input.title),
      type: input.type,
      sender_name: senderName,
      content: normalizeString(input.content),
      status: "inquiry" as const,
      user_id: user.id,
    };

    if (!payload.title || !payload.sender_name || !payload.content) {
      return failure("필수 항목을 모두 입력해 주세요.");
    }

    const { data, error } = await supabase
      .from("inquiries")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      return failure(error.message);
    }

    revalidatePath("/contact");
    revalidatePath("/mypage");
    revalidatePath("/admin/inquiries");

    return success(
      "문의가 정상적으로 접수되었습니다.",
      (data ?? undefined) as Inquiry | undefined,
    );
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "문의 접수 중 오류가 발생했습니다.",
    );
  }
}
