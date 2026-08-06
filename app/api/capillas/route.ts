import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const capillas = await prisma.capilla.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(capillas);
}

export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { nombre } = await req.json();
  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  const c = await prisma.capilla.create({ data: { nombre } });
  return NextResponse.json(c, { status: 201 });
}
