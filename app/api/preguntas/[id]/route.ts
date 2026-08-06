import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// PATCH /api/preguntas/:id -> edita enunciado/tipo/metadatos y actualiza opciones si se envían.
// IMPORTANTE: las opciones se actualizan por su `id` (no se borran y recrean) para no romper
// las respuestas de exámenes ya contestados, que guardan el id de la opción elegida.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  const body = await req.json();

  if (Array.isArray(body.opciones)) {
    const opcionesActuales = await prisma.opcion.findMany({ where: { preguntaId: id }, select: { id: true } });
    const idsActuales = new Set(opcionesActuales.map((o) => o.id));
    const idsEnviados = new Set(body.opciones.map((o: Record<string, unknown>) => o.id).filter(Boolean));

    // elimina solo las opciones que el admin quitó explícitamente del formulario
    const idsAEliminar = [...idsActuales].filter((idActual) => !idsEnviados.has(idActual));
    if (idsAEliminar.length > 0) {
      await prisma.opcion.deleteMany({ where: { id: { in: idsAEliminar } } });
    }

    for (let i = 0; i < body.opciones.length; i++) {
      const o = body.opciones[i] as Record<string, unknown>;
      const datos = {
        texto: o.texto as string | undefined,
        imagenUrl: o.imagenUrl as string | undefined,
        esCorrecta: !!o.esCorrecta,
        orden: typeof o.orden === "number" ? o.orden : i,
        grupo: o.grupo as string | undefined,
        parejaId: o.parejaId as string | undefined,
      };
      if (o.id && idsActuales.has(o.id as string)) {
        await prisma.opcion.update({ where: { id: o.id as string }, data: datos });
      } else {
        await prisma.opcion.create({ data: { ...datos, preguntaId: id } });
      }
    }
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
