import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// POST /api/examenes/:id/duplicar
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  const original = await prisma.examen.findUnique({ where: { id }, include: { preguntas: true } });
  if (!original) return NextResponse.json({ error: "Examen no encontrado." }, { status: 404 });

  const copia = await prisma.examen.create({
    data: {
      titulo: `${original.titulo} (copia)`,
      descripcion: original.descripcion,
      imagenPortadaUrl: original.imagenPortadaUrl,
      parroquiaId: original.parroquiaId,
      tiempoMaximoMin: original.tiempoMaximoMin,
      intentosPermitidos: original.intentosPermitidos,
      mezclarPreguntas: original.mezclarPreguntas,
      mezclarRespuestas: original.mezclarRespuestas,
      numPreguntasAlAzar: original.numPreguntasAlAzar,
      noRepetirPreguntas: original.noRepetirPreguntas,
      escalaCalificacion: original.escalaCalificacion,
      notaAprobatoria: original.notaAprobatoria,
      estado: "BORRADOR",
      examenOrigenId: original.examenOrigenId ?? original.id,
      version: original.version + 1,
      preguntas: {
        create: original.preguntas.map((ep) => ({
          preguntaId: ep.preguntaId,
          orden: ep.orden,
          puntos: ep.puntos,
        })),
      },
    },
  });
  return NextResponse.json(copia, { status: 201 });
}
