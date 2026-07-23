import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const examenId = req.nextUrl.searchParams.get("examenId") ?? undefined;
  const catequistaId = req.nextUrl.searchParams.get("catequistaId") ?? undefined;

  const filtroIntento =
    examenId || catequistaId
      ? { ...(examenId && { examenId }), ...(catequistaId && { catequistaId }) }
      : undefined;

  const preguntas = await prisma.pregunta.findMany({
    include: {
      respuestas: {
        where: filtroIntento ? { intento: filtroIntento } : undefined,
        include: { intento: { include: { resultado: true } } },
      },
    },
  });

  const analisis = preguntas
    .filter((p) => p.respuestas.length > 0)
    .map((p) => {
      const total = p.respuestas.length;
      const aciertos = p.respuestas.filter((r) => r.esCorrecta).length;
      const porcentajeAciertos = (aciertos / total) * 100;
      const tiempos = p.respuestas.map((r) => r.tiempoSegundos ?? 0).filter((t) => t > 0);
      const tiempoPromedio = tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;

      // discriminación simple: % aciertos en el grupo de mejor calificación global vs el de peor
      const conNota = p.respuestas
        .filter((r) => r.intento.resultado)
        .map((r) => ({ esCorrecta: r.esCorrecta, nota: r.intento.resultado!.calificacion }))
        .sort((a, b) => b.nota - a.nota);
      const corte = Math.max(1, Math.floor(conNota.length * 0.27));
      const grupoAlto = conNota.slice(0, corte);
      const grupoBajo = conNota.slice(-corte);
      const pctAlto = grupoAlto.filter((r) => r.esCorrecta).length / (grupoAlto.length || 1);
      const pctBajo = grupoBajo.filter((r) => r.esCorrecta).length / (grupoBajo.length || 1);
      const discriminacion = Math.round((pctAlto - pctBajo) * 100) / 100;

      return {
        id: p.id,
        enunciado: p.enunciado,
        totalRespuestas: total,
        porcentajeAciertos: Math.round(porcentajeAciertos * 100) / 100,
        porcentajeErrores: Math.round((100 - porcentajeAciertos) * 100) / 100,
        tiempoPromedioSegundos: Math.round(tiempoPromedio),
        discriminacion,
        dificultad:
          porcentajeAciertos >= 70 ? "fácil" : porcentajeAciertos >= 40 ? "media" : "difícil",
      };
    });

  const masFallada = [...analisis].sort((a, b) => a.porcentajeAciertos - b.porcentajeAciertos)[0] ?? null;
  const masAcertada = [...analisis].sort((a, b) => b.porcentajeAciertos - a.porcentajeAciertos)[0] ?? null;

  return NextResponse.json({ preguntas: analisis, masFallada, masAcertada });
}
