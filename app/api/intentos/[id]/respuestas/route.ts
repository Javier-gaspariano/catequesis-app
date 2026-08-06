import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/intentos/:id/respuestas -> upsert de una respuesta (no califica todavía, solo guarda)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { preguntaId, valor, tiempoSegundos } = await req.json();

  const intento = await prisma.intento.findUnique({ where: { id } });
  if (!intento || intento.estado !== "EN_PROGRESO") {
    return NextResponse.json({ error: "Intento no válido o ya finalizado." }, { status: 400 });
  }

  const respuesta = await prisma.respuesta.upsert({
    where: { intentoId_preguntaId: { intentoId: id, preguntaId } },
    update: { valorJson: valor, tiempoSegundos },
    create: { intentoId: id, preguntaId, valorJson: valor, tiempoSegundos },
  });
  return NextResponse.json(respuesta);
}
