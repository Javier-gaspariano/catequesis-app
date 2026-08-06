import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/estadisticas/alumnos-por-catequista?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const fechaDesde = req.nextUrl.searchParams.get("fechaDesde");
  const fechaHasta = req.nextUrl.searchParams.get("fechaHasta");

  const filtroFecha: Record<string, Date> = {};
  if (fechaDesde) filtroFecha.gte = new Date(`${fechaDesde}T00:00:00`);
  if (fechaHasta) filtroFecha.lte = new Date(`${fechaHasta}T23:59:59`);

  const intentos = await prisma.intento.findMany({
    where: {
      estado: "FINALIZADO",
      ...(fechaDesde || fechaHasta ? { finalizadoEn: filtroFecha } : {}),
    },
    include: { catequista: true },
  });

  const conteo = new Map<string, number>();
  for (const it of intentos) {
    const clave = it.catequista?.nombre ?? "Sin catequista";
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }

  const resultado = [...conteo.entries()]
    .map(([catequista, alumnos]) => ({ catequista, alumnos }))
    .sort((a, b) => b.alumnos - a.alumnos);

  return NextResponse.json(resultado);
}
