"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InquiryType } from "@/types";

export interface ContactInquiryInput {
  title: string;
  type: InquiryType;
  reply_contact: string;
  sender_name: string;
  content: string;
}

export interface ContactInquiryResult {
  status: "success" | "error";
  message: string;
}

function normalizeString(value: string) {
  return value.trim();
}

function success(message: string): ContactInquiryResult {
  return { status: "success", message };
}

function failure(message: string): ContactInquiryResult {
  return { status: "error", message };
}

export async function submitInquiry(
  input: ContactInquiryInput,
): Promise<ContactInquiryResult> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return failure("문의 접수를 위한 설정이 아직 연결되지 않았습니다.");
    }

    const payload = {
      title: normalizeString(input.title),
      type: input.type,
      reply_contact: normalizeString(input.reply_contact),
      sender_name: normalizeString(input.sender_name),
      content: normalizeString(input.content),
      status: "inquiry" as const,
    };

    if (!payload.title || !payload.reply_contact || !payload.sender_name || !payload.content) {
      return failure("필수 항목을 모두 입력해 주세요.");
    }

    const { error } = await supabase.from("inquiries").insert(payload);
    if (error) {
      return failure(error.message);
    }

    revalidatePath("/admin/inquiries");
    return success("문의가 정상적으로 접수되었습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "문의 접수 중 오류가 발생했습니다.");
  }
}
