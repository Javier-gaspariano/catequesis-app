import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const catequistas = await prisma.catequista.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(catequistas);
}

export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { nombre, email } = await req.json();
  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  const c = await prisma.catequista.create({ data: { nombre, email } });
  return NextResponse.json(c, { status: 201 });
}
