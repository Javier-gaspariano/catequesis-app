import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compararPassword, firmarSesion, NOMBRE_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Correo y contraseña son obligatorios." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const valido = await compararPassword(password, usuario.passwordHash);
  if (!valido) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const token = firmarSesion({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  });

  const res = NextResponse.json({ ok: true, nombre: usuario.nombre, rol: usuario.rol });
  res.cookies.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
