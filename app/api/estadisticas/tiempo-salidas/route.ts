import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/estadisticas/tiempo-salidas -> agrupado por examen
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;

  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO" },
    select: { tiempoSegundos: true, cambiosFoco: true, examen: { select: { titulo: true } } },
  });

  const grupos = new Map<string, { tiempos: number[]; salidas: number[]; conSalida: number }>();
  for (const it of intentos) {
    const clave = it.examen.titulo;
    const actual = grupos.get(clave) ?? { tiempos: [], salidas: [], conSalida: 0 };
    if (it.tiempoSegundos) actual.tiempos.push(it.tiempoSegundos);
    actual.salidas.push(it.cambiosFoco);
    if (it.cambiosFoco > 0) actual.conSalida += 1;
    grupos.set(clave, actual);
  }

  const resultado = [...grupos.entries()].map(([examen, v]) => ({
    examen,
    participantes: v.salidas.length,
    tiempoPromedioMinutos: v.tiempos.length
      ? Math.round((v.tiempos.reduce((a, b) => a + b, 0) / v.tiempos.length / 60) * 10) / 10
      : 0,
    salidasPromedio: v.salidas.length
      ? Math.round((v.salidas.reduce((a, b) => a + b, 0) / v.salidas.length) * 10) / 10
      : 0,
    conSalida: v.conSalida,
  }));

  return NextResponse.json(resultado);
}
