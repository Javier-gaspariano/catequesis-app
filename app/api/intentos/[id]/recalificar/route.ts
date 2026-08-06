import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calificarRespuesta, calcularCalificacion } from "@/lib/calificacion";
import { requireAdmin } from "@/lib/require-admin";

// POST /api/intentos/:id/recalificar -> vuelve a calificar con la lógica actual (no cambia el estado ni las respuestas)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;

  const intento = await prisma.intento.findUnique({
    where: { id },
    include: {
      respuestas: true,
      examen: { include: { preguntas: { include: { pregunta: { include: { opciones: true } } } } } },
    },
  });
  if (!intento) return NextResponse.json({ error: "Intento no encontrado." }, { status: 404 });

  let aciertos = 0;
  const totalPreguntas = intento.examen.preguntas.length;
  for (const ep of intento.examen.preguntas) {
    const respuesta = intento.respuestas.find((r) => r.preguntaId === ep.preguntaId);
    const esCorrecta = respuesta?.revisadoManualmente
      ? respuesta.esCorrecta
      : respuesta
      ? calificarRespuesta(ep.pregunta, respuesta.valorJson)
      : false;
    aciertos += esCorrecta === true ? 1 : 0;
    if (respuesta && !respuesta.revisadoManualmente && respuesta.esCorrecta !== esCorrecta) {
      await prisma.respuesta.update({ where: { id: respuesta.id }, data: { esCorrecta } });
    }
  }

  const { porcentaje, calificacion, aprobado } = calcularCalificacion(
    aciertos,
    totalPreguntas,
    intento.examen.escalaCalificacion,
    intento.examen.notaAprobatoria
  );

  const resultado = await prisma.resultado.upsert({
    where: { intentoId: id },
    update: { aciertos, errores: totalPreguntas - aciertos, porcentaje, calificacion, aprobado },
    create: { intentoId: id, aciertos, errores: totalPreguntas - aciertos, porcentaje, calificacion, aprobado },
  });

  return NextResponse.json({ resultado });
}
