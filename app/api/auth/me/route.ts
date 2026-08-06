import { NextRequest, NextResponse } from "next/server";
import { verificarSesion, NOMBRE_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(NOMBRE_COOKIE)?.value;
  const sesion = token ? verificarSesion(token) : null;
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  return NextResponse.json(sesion);
}
