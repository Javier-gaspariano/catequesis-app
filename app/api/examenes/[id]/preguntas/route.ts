import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/examenes/:id/preguntas -> preguntas asignadas
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  const asignadas = await prisma.examenPregunta.findMany({
    where: { examenId: id },
    include: { pregunta: { include: { opciones: true } } },
    orderBy: { orden: "asc" },
  });
  return NextResponse.json(asignadas);
}

// POST /api/examenes/:id/preguntas -> asigna una pregunta { preguntaId, puntos }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  const { preguntaId, puntos } = await req.json();
  const orden = await prisma.examenPregunta.count({ where: { examenId: id } });
  const ep = await prisma.examenPregunta.create({
    data: { examenId: id, preguntaId, puntos: puntos ?? 1, orden },
  });
  return NextResponse.json(ep, { status: 201 });
}

// DELETE /api/examenes/:id/preguntas?preguntaId=xxx -> desasigna
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  const preguntaId = req.nextUrl.searchParams.get("preguntaId");
  if (!preguntaId) return NextResponse.json({ error: "Falta preguntaId." }, { status: 400 });
  await prisma.examenPregunta.delete({
    where: { examenId_preguntaId: { examenId: id, preguntaId } },
  });
  return NextResponse.json({ ok: true });
}
