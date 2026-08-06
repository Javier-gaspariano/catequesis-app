import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { calcularCalificacion } from "@/lib/calificacion";

// GET /api/respuestas-pendientes -> respuestas con esCorrecta = null:
// dudosas por ortografía (completar espacios) o recuperadas manualmente desde un reporte descargado
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;

  const pendientes = await prisma.respuesta.findMany({
    where: {
      esCorrecta: null,
      intento: { estado: "FINALIZADO" },
      OR: [{ pregunta: { tipo: "COMPLETAR_ESPACIOS" } }, { valorRecuperadoTexto: { not: null } }],
    },
    include: {
      pregunta: { include: { opciones: true } },
      intento: { include: { examen: { select: { titulo: true } }, catequista: true, capilla: true } },
    },
    orderBy: { respondidaEn: "desc" },
  });

  return NextResponse.json(
    pendientes.map((r) => ({
      id: r.id,
      valorJson: r.valorRecuperadoTexto ?? (typeof r.valorJson === "string" ? r.valorJson : JSON.stringify(r.valorJson)),
      recuperado: !!r.valorRecuperadoTexto,
      alumno: r.intento.nombreCompleto,
      examen: r.intento.examen.titulo,
      catequista: r.intento.catequista?.nombre ?? null,
      capilla: r.intento.capilla?.nombre ?? null,
      pregunta: r.pregunta.enunciado,
      respuestasCorrectas: r.pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.texto),
      intentoId: r.intentoId,
    }))
  );
}

// PATCH /api/respuestas-pendientes { id, correcta } -> marca la respuesta y recalcula el resultado del intento
export async function PATCH(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id, correcta } = await req.json();

  const respuesta = await prisma.respuesta.update({
    where: { id },
    data: { esCorrecta: !!correcta, revisadoManualmente: true },
  });

  const intento = await prisma.intento.findUnique({
    where: { id: respuesta.intentoId },
    include: {
      respuestas: true,
      examen: { include: { preguntas: true } },
    },
  });
  if (!intento) return NextResponse.json({ ok: true });

  const totalPreguntas = intento.examen.preguntas.length;
  const aciertos = intento.respuestas.filter((r) => r.esCorrecta === true).length;
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

  return NextResponse.json({ ok: true });
}
