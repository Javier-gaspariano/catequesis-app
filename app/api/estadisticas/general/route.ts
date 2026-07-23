import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const [resultados, aprobados, reprobados, intentos] = await Promise.all([
    prisma.resultado.aggregate({ _avg: { calificacion: true, porcentaje: true } }),
    prisma.resultado.count({ where: { aprobado: true } }),
    prisma.resultado.count({ where: { aprobado: false } }),
    prisma.intento.findMany({
      where: { estado: "FINALIZADO" },
      select: { tiempoSegundos: true, edad: true, sexo: true, grupo: true },
    }),
  ]);

  const tiempos = intentos.map((i) => i.tiempoSegundos ?? 0).filter((t) => t > 0);
  const tiempoPromedio = tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;

  return NextResponse.json({
    participantes: intentos.length,
    promedioCalificacion: resultados._avg.calificacion ?? 0,
    promedioPorcentaje: resultados._avg.porcentaje ?? 0,
    aprobados,
    reprobados,
    tiempoPromedioSegundos: Math.round(tiempoPromedio),
  });
}
