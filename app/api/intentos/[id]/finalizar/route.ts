import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calificarRespuesta, calcularCalificacion } from "@/lib/calificacion";
import { randomUUID } from "crypto";
import { enviarCorreoResultado } from "@/lib/notificaciones";

// POST /api/intentos/:id/finalizar -> valida que no falten preguntas, califica y genera folio de certificado si aprueba
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cambiosFoco, eventosFoco, forzado } = await req
    .json()
    .catch(() => ({ cambiosFoco: undefined, eventosFoco: undefined, forzado: false }));

  const intento = await prisma.intento.findUnique({
    where: { id },
    include: {
      respuestas: true,
      examen: { include: { preguntas: { include: { pregunta: { include: { opciones: true } } } } } },
    },
  });
  if (!intento) return NextResponse.json({ error: "Intento no encontrado." }, { status: 404 });
  if (intento.estado === "FINALIZADO") {
    const resultado = await prisma.resultado.findUnique({ where: { intentoId: id } });
    return NextResponse.json({ intento, resultado });
  }

  const totalPreguntas = intento.examen.preguntas.length;
  const pendientes = intento.examen.preguntas
    .map((ep) => ep.preguntaId)
    .filter((pid) => !intento.respuestas.some((r) => r.preguntaId === pid));

  if (pendientes.length > 0 && !forzado) {
    return NextResponse.json(
      { error: "Todavía existen preguntas sin responder.", preguntasPendientes: pendientes },
      { status: 400 }
    );
  }

  let aciertos = 0;
  for (const ep of intento.examen.preguntas) {
    const respuesta = intento.respuestas.find((r) => r.preguntaId === ep.preguntaId);
    const esCorrecta = respuesta ? calificarRespuesta(ep.pregunta, respuesta.valorJson) : false;
    aciertos += esCorrecta ? 1 : 0;
    if (respuesta) {
      await prisma.respuesta.update({ where: { id: respuesta.id }, data: { esCorrecta } });
    }
  }

  const { porcentaje, calificacion, aprobado } = calcularCalificacion(
    aciertos,
    totalPreguntas,
    intento.examen.escalaCalificacion,
    intento.examen.notaAprobatoria
  );

  const tiempoSegundos = Math.floor((Date.now() - intento.iniciadoEn.getTime()) / 1000);

  const [, resultado] = await prisma.$transaction([
    prisma.intento.update({
      where: { id },
      data: {
        estado: "FINALIZADO",
        finalizadoEn: new Date(),
        tiempoSegundos,
        ...(typeof cambiosFoco === "number" && { cambiosFoco }),
        ...(Array.isArray(eventosFoco) && { eventosFoco }),
        ...(forzado && { cerradoPorLimiteSalidas: true }),
      },
    }),
    prisma.resultado.upsert({
      where: { intentoId: id },
      update: { aciertos, errores: totalPreguntas - aciertos, porcentaje, calificacion, aprobado },
      create: {
        intentoId: id,
        aciertos,
        errores: totalPreguntas - aciertos,
        porcentaje,
        calificacion,
        aprobado,
      },
    }),
  ]);

  let certificado = null;
  if (aprobado && intento.examen.emiteCertificado) {
    certificado = await prisma.certificado.upsert({
      where: { intentoId: id },
      update: {},
      create: { intentoId: id, folio: `CAT-${randomUUID().slice(0, 8).toUpperCase()}` },
    });
    // La generación real del PDF + QR ocurre en /api/certificados/:id (Fase 6)
  }

  const intentoConCatequista = await prisma.intento.findUnique({
    where: { id },
    include: { catequista: true },
  });
  if (intentoConCatequista?.catequista?.email) {
    enviarCorreoResultado({
      destinatario: intentoConCatequista.catequista.email,
      nombreAlumno: intento.nombreCompleto,
      examen: intento.examen.titulo,
      calificacion,
      aprobado,
      urlCertificado: aprobado ? `${req.nextUrl.origin}/api/certificados/${id}` : undefined,
    }).catch(() => {
      /* no bloquear el flujo del examen si falla el correo */
    });
  }

  return NextResponse.json({ resultado, certificado });
}
