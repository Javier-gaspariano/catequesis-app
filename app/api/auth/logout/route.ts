import { NextResponse } from "next/server";
import { NOMBRE_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NOMBRE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
