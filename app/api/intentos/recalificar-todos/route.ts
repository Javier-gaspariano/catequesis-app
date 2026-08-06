import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calificarRespuesta, calcularCalificacion } from "@/lib/calificacion";
import { requireAdmin } from "@/lib/require-admin";

// POST /api/intentos/recalificar-todos -> recalifica todos los intentos finalizados con la lógica actual
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;

  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO" },
    include: {
      respuestas: true,
      examen: { include: { preguntas: { include: { pregunta: { include: { opciones: true } } } } } },
    },
  });

  let actualizados = 0;
  for (const intento of intentos) {
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
    await prisma.resultado.upsert({
      where: { intentoId: intento.id },
      update: { aciertos, errores: totalPreguntas - aciertos, porcentaje, calificacion, aprobado },
      create: {
        intentoId: intento.id,
        aciertos,
        errores: totalPreguntas - aciertos,
        porcentaje,
        calificacion,
        aprobado,
      },
    });
    actualizados += 1;
  }

  return NextResponse.json({ actualizados });
}
