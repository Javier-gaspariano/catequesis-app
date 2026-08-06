import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const sp = req.nextUrl.searchParams;
  const examenId = sp.get("examenId") ?? undefined;
  const catequistaId = sp.get("catequistaId") ?? undefined;
  const capillaId = sp.get("capillaId") ?? undefined;
  const dificultad = sp.get("dificultad") ?? undefined;
  const porcentajeMin = sp.get("porcentajeMin") ? Number(sp.get("porcentajeMin")) : undefined;
  const porcentajeMax = sp.get("porcentajeMax") ? Number(sp.get("porcentajeMax")) : undefined;

  const filtroIntento =
    examenId || catequistaId || capillaId
      ? { ...(examenId && { examenId }), ...(catequistaId && { catequistaId }), ...(capillaId && { capillaId }) }
      : undefined;

  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO", ...filtroIntento },
    include: { resultado: true },
  });
  const numAlumnos = intentos.length;
  const calificaciones = intentos.map((i) => i.resultado?.calificacion).filter((c): c is number => c != null);
  const promedioGeneral = calificaciones.length
    ? Math.round((calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length) * 100) / 100
    : 0;
  const conSalida = intentos.filter((i) => i.cambiosFoco > 0).length;
  const porcentajeSalidasGeneral = numAlumnos ? Math.round((conSalida / numAlumnos) * 10000) / 100 : 0;

  // conteo de salidas de pantalla por pregunta (se identifica por el enunciado guardado en el evento,
  // ya que el orden de las preguntas puede variar de alumno a alumno si el examen mezcla preguntas)
  const salidasPorEnunciado = new Map<string, number>();
  for (const it of intentos) {
    const eventos = (it.eventosFoco as unknown as { preguntaEnunciado: string }[] | null) ?? [];
    const enunciadosUnicos = new Set(eventos.map((e) => e.preguntaEnunciado));
    for (const enunciado of enunciadosUnicos) {
      salidasPorEnunciado.set(enunciado, (salidasPorEnunciado.get(enunciado) ?? 0) + 1);
    }
  }

  const [examen, catequista, capilla] = await Promise.all([
    examenId ? prisma.examen.findUnique({ where: { id: examenId }, select: { titulo: true } }) : null,
    catequistaId ? prisma.catequista.findUnique({ where: { id: catequistaId }, select: { nombre: true } }) : null,
    capillaId ? prisma.capilla.findUnique({ where: { id: capillaId }, select: { nombre: true } }) : null,
  ]);

  const preguntas = await prisma.pregunta.findMany({
    include: {
      respuestas: {
        where: filtroIntento ? { intento: filtroIntento } : undefined,
        include: { intento: { include: { resultado: true } } },
      },
    },
  });

  let analisis = preguntas
    .filter((p) => p.respuestas.length > 0)
    .map((p) => {
      const total = p.respuestas.length;
      const aciertos = p.respuestas.filter((r) => r.esCorrecta).length;
      const porcentajeAciertos = Math.round((aciertos / total) * 10000) / 100;
      const porcentajeSalidas = numAlumnos
        ? Math.round(((salidasPorEnunciado.get(p.enunciado) ?? 0) / numAlumnos) * 10000) / 100
        : 0;
      return {
        id: p.id,
        enunciado: p.enunciado,
        porcentajeAciertos,
        porcentajeSalidas,
        dificultad: porcentajeAciertos >= 70 ? "fácil" : porcentajeAciertos >= 40 ? "media" : "difícil",
      };
    });

  if (dificultad) analisis = analisis.filter((p) => p.dificultad === dificultad);
  if (porcentajeMin !== undefined) analisis = analisis.filter((p) => p.porcentajeAciertos >= porcentajeMin);
  if (porcentajeMax !== undefined) analisis = analisis.filter((p) => p.porcentajeAciertos <= porcentajeMax);
  analisis.sort((a, b) => b.porcentajeAciertos - a.porcentajeAciertos);

  const masFallada = [...analisis].sort((a, b) => a.porcentajeAciertos - b.porcentajeAciertos)[0] ?? null;
  const masAcertada = [...analisis].sort((a, b) => b.porcentajeAciertos - a.porcentajeAciertos)[0] ?? null;

  const alumnosConSalida = intentos
    .filter((i) => i.cambiosFoco > 0)
    .map((i) => ({
      nombreCompleto: i.nombreCompleto,
      cambiosFoco: i.cambiosFoco,
      calificacion: i.resultado?.calificacion ?? null,
    }))
    .sort((a, b) => b.cambiosFoco - a.cambiosFoco);

  const alumnos = intentos
    .map((i) => ({
      nombreCompleto: i.nombreCompleto,
      calificacion: i.resultado?.calificacion ?? null,
      aprobado: i.resultado?.aprobado ?? null,
    }))
    .sort((a, b) => (b.calificacion ?? -1) - (a.calificacion ?? -1));

  return NextResponse.json({
    capilla: capilla?.nombre ?? null,
    catequista: catequista?.nombre ?? null,
    examen: examen?.titulo ?? null,
    numAlumnos,
    promedioGeneral,
    porcentajeSalidasGeneral,
    preguntas: analisis,
    masFallada,
    masAcertada,
    alumnosConSalida,
    alumnos,
  });
}
