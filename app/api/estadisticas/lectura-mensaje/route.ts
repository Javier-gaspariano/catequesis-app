import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/estadisticas/lectura-mensaje -> % de padres que marcaron la casilla correcta, por examen
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;

  const intentos = await prisma.intento.findMany({
    where: { lecturaCorrecta: { not: null } },
    select: { lecturaCorrecta: true, examen: { select: { titulo: true } } },
  });

  const grupos = new Map<string, { total: number; correctos: number }>();
  for (const it of intentos) {
    const clave = it.examen.titulo;
    const actual = grupos.get(clave) ?? { total: 0, correctos: 0 };
    actual.total += 1;
    if (it.lecturaCorrecta) actual.correctos += 1;
    grupos.set(clave, actual);
  }

  const resultado = [...grupos.entries()].map(([examen, v]) => ({
    examen,
    total: v.total,
    correctos: v.correctos,
    porcentaje: v.total ? Math.round((v.correctos / v.total) * 1000) / 10 : 0,
  }));

  return NextResponse.json(resultado);
}
