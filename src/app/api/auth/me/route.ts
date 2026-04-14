import { NextResponse } from "next/server";

import { getUserFromSession } from "@/lib/auth/user";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    birth_date: user.birth_date,
    level: user.level ?? 1,
    experience: user.experience ?? 0,
  };

  return NextResponse.json({ user: safeUser }, { status: 200 });
}
