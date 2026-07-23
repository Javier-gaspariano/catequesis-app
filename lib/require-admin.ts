import { NextRequest, NextResponse } from "next/server";
import { verificarSesion, NOMBRE_COOKIE, SesionUsuario } from "./auth";

export function obtenerSesionApi(req: NextRequest): SesionUsuario | null {
  const token = req.cookies.get(NOMBRE_COOKIE)?.value;
  return token ? verificarSesion(token) : null;
}

/** Devuelve una respuesta 401 si no hay sesión válida, o null si puede continuar. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const sesion = obtenerSesionApi(req);
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado. Inicia sesión como administrador." }, { status: 401 });
  }
  return null;
}
