import { cookies } from "next/headers";
import crypto from "node:crypto";

import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { formatKstDateTimeString, parseKstDate } from "@/lib/utils";

const SESSION_COOKIE = "sufhub_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const computed = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== computed.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, computed);
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createUserSession(userId: string) {
  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }

  const token = createSessionToken();
  const expiresAt = formatKstDateTimeString(
    new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  );

  const { error } = await supabase
    .from("user_sessions")
    .insert({ user_id: userId, session_token: token, expires_at: expiresAt });

  if (error) {
    throw error;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return token;
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  if (!token) {
    return;
  }

  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (supabase) {
    await supabase.from("user_sessions").delete().eq("session_token", token);
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  if (!token) return null;

  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_sessions")
    .select("user:users(*)")
    .eq("session_token", token)
    .gt("expires_at", formatKstDateTimeString(new Date()))
    .maybeSingle();

  if (error || !data?.user) {
    return null;
  }

  const isSuspended =
    data.user.suspended_until &&
    parseKstDate(data.user.suspended_until).getTime() > Date.now();

  if (data.user.status === "expelled" || data.user.is_active === false || isSuspended) {
    if (supabase && token) {
      await supabase.from("user_sessions").delete().eq("session_token", token);
    }

    cookieStore.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return null;
  }

  return data.user;
}
