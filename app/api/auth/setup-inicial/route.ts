import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// POST /api/auth/setup-inicial  { nombre, email, password }
// Solo funciona UNA VEZ: si ya existe al menos un usuario, se rechaza.
// Después de crear tu primer admin, esta ruta queda inutilizable por seguridad.
export async function POST(req: NextRequest) {
  const totalUsuarios = await prisma.usuario.count();
  if (totalUsuarios > 0) {
    return NextResponse.json(
      { error: "Ya existe al menos un usuario. Esta configuración inicial ya no está disponible." },
      { status: 403 }
    );
  }

  const { nombre, email, password } = await req.json();
  if (!nombre || !email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Nombre, correo y contraseña (mínimo 8 caracteres) son obligatorios." },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash: await hashPassword(password), rol: "ADMIN_GENERAL" },
  });

  return NextResponse.json({ ok: true, email: usuario.email });
}
