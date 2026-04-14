"use server";

import crypto from "node:crypto";

import { clearUserSession, createUserSession, hashPassword, verifyPassword } from "@/lib/auth/user";
import { sendAuthEmail } from "@/lib/email/smtp";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { formatKstDateTimeString, parseKstDate } from "@/lib/utils";

const TERMS_VERSION = "2026-04-13";
const PRIVACY_VERSION = "2026-04-13";

function normalize(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return value.includes("@") && value.includes(".");
}

function getAuthSupabase() {
  return createServiceSupabaseClient() ?? createPublicSupabaseClient();
}

async function findUserByEmail(
  supabase: ReturnType<typeof getAuthSupabase>,
  email: string,
) {
  if (!supabase) return null;

  const { data: exactMatches } = await supabase
    .from("users")
    .select("id, username, status, email")
    .ilike("email", email)
    .limit(2);

  if (exactMatches && exactMatches.length > 0) {
    return exactMatches[0] ?? null;
  }

  const { data: looseMatches } = await supabase
    .from("users")
    .select("id, username, status, email")
    .ilike("email", `${email}%`)
    .limit(2);

  return looseMatches && looseMatches.length > 0 ? looseMatches[0] ?? null : null;
}

function hashVerificationCode(code: string, email: string) {
  const salt = process.env.AUTH_CODE_SALT ?? "";
  return crypto
    .createHash("sha256")
    .update(`${code}:${email}:${salt}`)
    .digest("hex");
}

function generateVerificationCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

function maskUsername(value: string) {
  if (value.length <= 2) return `${value[0]}*`;
  if (value.length <= 4) return `${value[0]}${"*".repeat(value.length - 2)}${value[value.length - 1]}`;
  return `${value.slice(0, 2)}${"*".repeat(value.length - 3)}${value[value.length - 1]}`;
}

export async function registerUser(formData: FormData) {
  const supabase = getAuthSupabase();
  if (!supabase) {
    return { status: "error", message: "서버 설정이 올바르지 않습니다." };
  }

  const username = normalize(formData.get("username"));
  const password = normalize(formData.get("password"));
  const passwordConfirm = normalize(formData.get("password_confirm"));
  const email = normalize(formData.get("email")).toLowerCase();
  const nickname = normalize(formData.get("nickname"));
  const birthDate = normalize(formData.get("birth_date"));
  const consent = normalize(formData.get("consent"));

  if (!username || username.length < 4) {
    return { status: "error", message: "아이디는 4자 이상 입력해 주세요." };
  }

  if (!password || password.length < 8) {
    return { status: "error", message: "비밀번호는 8자 이상이어야 합니다." };
  }

  if (!passwordConfirm || passwordConfirm !== password) {
    return { status: "error", message: "비밀번호 확인이 일치하지 않습니다." };
  }

  if (!email || !isValidEmail(email)) {
    return { status: "error", message: "이메일 형식을 확인해 주세요." };
  }

  if (!nickname || nickname.length < 2) {
    return { status: "error", message: "닉네임은 2자 이상 입력해 주세요." };
  }

  if (!birthDate) {
    return { status: "error", message: "생년월일을 입력해 주세요." };
  }

  if (consent !== "yes") {
    return { status: "error", message: "약관 및 개인정보 동의가 필요합니다." };
  }

  const [{ data: usernameDup }, { data: nicknameDup }, { data: emailDup }] = await Promise.all([
    supabase.from("users").select("id").eq("username", username).limit(1).maybeSingle(),
    supabase.from("users").select("id").eq("nickname", nickname).limit(1).maybeSingle(),
    supabase.from("users").select("id").ilike("email", email).limit(1).maybeSingle(),
  ]);

  const { data: banRow } = await supabase
    .from("user_banlist")
    .select("id")
    .or(`login_id.eq.${username},email.ilike.${email}`)
    .limit(1)
    .maybeSingle();

  if (banRow) {
    return { status: "error", message: "퇴출된 계정 정보로는 가입할 수 없습니다." };
  }

  if (usernameDup) {
    return { status: "error", message: "이미 사용 중인 아이디입니다." };
  }
  if (nicknameDup) {
    return { status: "error", message: "이미 사용 중인 닉네임입니다." };
  }
  if (emailDup) {
    return { status: "error", message: "이미 사용 중인 이메일입니다." };
  }

  const passwordHash = hashPassword(password);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      username,
      password_hash: passwordHash,
      email,
      nickname,
      birth_date: birthDate,
      is_active: true,
      level: 1,
      experience: 0,
    })
    .select("*")
    .maybeSingle();

  if (error || !user) {
    return { status: "error", message: "회원가입에 실패했습니다." };
  }

  await supabase.from("user_consents").insert({
    user_id: user.id,
    terms_version: TERMS_VERSION,
    privacy_version: PRIVACY_VERSION,
  });

  await createUserSession(user.id);

  return { status: "success", message: "회원가입이 완료되었습니다." };
}

export async function loginUser(formData: FormData) {
  const supabase = getAuthSupabase();
  if (!supabase) {
    return { status: "error", message: "서버 설정이 올바르지 않습니다." };
  }

  const username = normalize(formData.get("username"));
  const password = normalize(formData.get("password"));

  if (!username || !password) {
    return { status: "error", message: "아이디와 비밀번호를 입력해 주세요." };
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!user || !verifyPassword(password, user.password_hash ?? "")) {
    return { status: "error", message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  if (user.status === "expelled") {
    return { status: "error", message: "퇴출된 계정입니다. 관리자에게 문의해 주세요." };
  }

  if (user.suspended_until) {
    const suspendedUntil = parseKstDate(user.suspended_until);
    if (suspendedUntil.getTime() > Date.now()) {
      return {
        status: "error",
        message: `정지된 계정입니다. ${formatKstDateTimeString(suspendedUntil)}까지 로그인할 수 없습니다.`,
      };
    }
  }

  if (user.is_active === false) {
    return { status: "error", message: "비활성화된 계정입니다." };
  }

  await createUserSession(user.id);

  return { status: "success", message: "로그인되었습니다." };
}

export async function logoutUser() {
  await clearUserSession();
  return { status: "success" };
}

export async function sendAuthVerificationCode(formData: FormData) {
  const supabase = getAuthSupabase();
  if (!supabase) {
    return { status: "error", message: "서버 설정이 올바르지 않습니다." };
  }

  const email = normalize(formData.get("email")).toLowerCase();
  const purpose = normalize(formData.get("purpose")) as "find_id" | "reset_pw";
  const username = normalize(formData.get("username"));

  if (!email || !isValidEmail(email)) {
    return { status: "error", message: "이메일 형식을 확인해 주세요." };
  }

  if (purpose !== "find_id" && purpose !== "reset_pw") {
    return { status: "error", message: "요청 정보가 올바르지 않습니다." };
  }

  if (purpose === "reset_pw" && !username) {
    return { status: "error", message: "아이디를 입력해 주세요." };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, username, status")
    .ilike("email", email)
    .maybeSingle();

  if (userError) {
    console.error("[sendAuthVerificationCode] users 조회 실패:", userError);
    return { status: "error", message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (!user) {
    return { status: "error", message: "등록된 이메일이 없습니다." };
  }

  if (purpose === "reset_pw" && user.username !== username) {
    return { status: "error", message: "아이디 또는 이메일 정보가 올바르지 않습니다." };
  }

  if (user.status === "expelled") {
    return { status: "error", message: "퇴출된 계정입니다." };
  }

  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code, email);
  const expiresAt = formatKstDateTimeString(new Date(Date.now() + 10 * 60 * 1000));

  const { error: insertError } = await supabase.from("auth_email_verifications").insert({
    email,
    purpose,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[sendAuthVerificationCode] 인증번호 저장 실패:", insertError);
    return { status: "error", message: "인증번호 발송에 실패했습니다." };
  }

  const subject = purpose === "find_id" ? "SuFHub 아이디 찾기 인증번호" : "SuFHub 비밀번호 재설정 인증번호";
  const text = `SuFHub 인증번호는 ${code} 입니다.\n\n유효시간은 10분이며, 타인에게 공유하지 마세요.`;

  try {
    await sendAuthEmail({ to: email, subject, text });
  } catch (err) {
    return { status: "error", message: "이메일 발송에 실패했습니다." };
  }

  return { status: "success", message: "인증번호를 이메일로 발송했습니다." };
}

export async function verifyFindId(formData: FormData) {
  const supabase = getAuthSupabase();
  if (!supabase) {
    return { status: "error", message: "서버 설정이 올바르지 않습니다." };
  }

  const email = normalize(formData.get("email")).toLowerCase();
  const code = normalize(formData.get("code"));

  if (!email || !isValidEmail(email)) {
    return { status: "error", message: "이메일 형식을 확인해 주세요." };
  }

  if (!code) {
    return { status: "error", message: "인증번호를 입력해 주세요." };
  }

  const { data: record } = await supabase
    .from("auth_email_verifications")
    .select("*")
    .ilike("email", email)
    .eq("purpose", "find_id")
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) {
    return { status: "error", message: "인증번호를 먼저 발급해 주세요." };
  }

  if ((record.attempts ?? 0) >= 5) {
    return { status: "error", message: "인증번호 입력 횟수가 초과되었습니다. 다시 발급해 주세요." };
  }

  const expiresAt = parseKstDate(record.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    return { status: "error", message: "인증번호가 만료되었습니다." };
  }

  const hashed = hashVerificationCode(code, email);
  if (hashed !== record.code_hash) {
    await supabase
      .from("auth_email_verifications")
      .update({ attempts: (record.attempts ?? 0) + 1 })
      .eq("id", record.id);
    return { status: "error", message: "인증번호가 올바르지 않습니다." };
  }

  await supabase
    .from("auth_email_verifications")
    .update({ used_at: formatKstDateTimeString(new Date()) })
    .eq("id", record.id);

  const { data: users } = await supabase
    .from("users")
    .select("username")
    .ilike("email", email);

  const usernames = (users ?? []).map((row) => maskUsername(row.username));

  if (!usernames.length) {
    return { status: "error", message: "등록된 계정을 찾지 못했습니다." };
  }

  return { status: "success", message: "아이디를 확인했습니다.", usernames };
}

export async function resetPasswordWithCode(formData: FormData) {
  const supabase = getAuthSupabase();
  if (!supabase) {
    return { status: "error", message: "서버 설정이 올바르지 않습니다." };
  }

  const email = normalize(formData.get("email")).toLowerCase();
  const code = normalize(formData.get("code"));
  const password = normalize(formData.get("password"));
  const passwordConfirm = normalize(formData.get("password_confirm"));

  if (!email || !isValidEmail(email)) {
    return { status: "error", message: "이메일 형식을 확인해 주세요." };
  }

  if (!code) {
    return { status: "error", message: "인증번호를 입력해 주세요." };
  }

  if (!password || password.length < 8) {
    return { status: "error", message: "비밀번호는 8자 이상이어야 합니다." };
  }

  if (passwordConfirm !== password) {
    return { status: "error", message: "비밀번호 확인이 일치하지 않습니다." };
  }

  const { data: record } = await supabase
    .from("auth_email_verifications")
    .select("*")
    .ilike("email", email)
    .eq("purpose", "reset_pw")
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) {
    return { status: "error", message: "인증번호를 먼저 발급해 주세요." };
  }

  if ((record.attempts ?? 0) >= 5) {
    return { status: "error", message: "인증번호 입력 횟수가 초과되었습니다. 다시 발급해 주세요." };
  }

  const expiresAt = parseKstDate(record.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    return { status: "error", message: "인증번호가 만료되었습니다." };
  }

  const hashed = hashVerificationCode(code, email);
  if (hashed !== record.code_hash) {
    await supabase
      .from("auth_email_verifications")
      .update({ attempts: (record.attempts ?? 0) + 1 })
      .eq("id", record.id);
    return { status: "error", message: "인증번호가 올바르지 않습니다." };
  }

  const passwordHash = hashPassword(password);
  const { data: user } = await supabase.from("users").select("id").ilike("email", email).maybeSingle();

  if (!user) {
    return { status: "error", message: "등록된 계정을 찾지 못했습니다." };
  }

  const { error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: "비밀번호 변경에 실패했습니다." };
  }

  await supabase
    .from("auth_email_verifications")
    .update({ used_at: formatKstDateTimeString(new Date()) })
    .eq("id", record.id);

  return { status: "success", message: "비밀번호가 변경되었습니다." };
}
