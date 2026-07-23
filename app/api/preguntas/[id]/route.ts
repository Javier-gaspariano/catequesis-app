import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// PATCH /api/preguntas/:id -> edita enunciado/tipo/metadatos y reemplaza opciones si se envían
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  const body = await req.json();

  if (Array.isArray(body.opciones)) {
    await prisma.opcion.deleteMany({ where: { preguntaId: id } });
  }

  const pregunta = await prisma.pregunta.update({
    where: { id },
    data: {
      enunciado: body.enunciado,
      tipo: body.tipo,
      imagenUrl: body.imagenUrl,
      audioUrl: body.audioUrl,
      videoUrl: body.videoUrl,
      tema: body.tema,
      nivel: body.nivel,
      dificultad: body.dificultad,
      retroalimentacion: body.retroalimentacion,
      tiempoRespuestaSegundos: body.tiempoRespuestaSegundos ?? null,
      ...(Array.isArray(body.opciones) && {
        opciones: {
          create: body.opciones.map((o: Record<string, unknown>, i: number) => ({
            texto: o.texto,
            imagenUrl: o.imagenUrl,
            esCorrecta: !!o.esCorrecta,
            orden: typeof o.orden === "number" ? o.orden : i,
            grupo: o.grupo,
            parejaId: o.parejaId,
          })),
        },
      }),
    },
    include: { opciones: true },
  });
  return NextResponse.json(pregunta);
}

// DELETE /api/preguntas/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  try {
    await prisma.pregunta.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: esta pregunta está asignada a uno o más exámenes. Quítala del examen primero." },
      { status: 409 }
    );
  }
}
