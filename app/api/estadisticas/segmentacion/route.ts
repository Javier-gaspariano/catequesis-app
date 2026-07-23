import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const DIMENSIONES = ["capilla", "catequista", "edad", "sexo", "grupo", "examen"] as const;
type Dimension = (typeof DIMENSIONES)[number];

export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const dimension = (req.nextUrl.searchParams.get("por") ?? "capilla") as Dimension;
  if (!DIMENSIONES.includes(dimension)) {
    return NextResponse.json({ error: "Dimensión no válida." }, { status: 400 });
  }

  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO" },
    include: { resultado: true, capilla: true, catequista: true, examen: { select: { titulo: true } } },
  });

  const grupos = new Map<string, { suma: number; cuenta: number; aprobados: number }>();

  for (const it of intentos) {
    if (!it.resultado) continue;
    let clave: string;
    switch (dimension) {
      case "capilla":
        clave = it.capilla?.nombre ?? "Sin capilla";
        break;
      case "catequista":
        clave = it.catequista?.nombre ?? "Sin catequista";
        break;
      case "edad":
        clave = String(it.edad);
        break;
      case "sexo":
        clave = it.sexo ?? "No especificado";
        break;
      case "grupo":
        clave = it.grupo ?? "Sin grupo";
        break;
      case "examen":
        clave = it.examen.titulo;
        break;
    }
    const actual = grupos.get(clave) ?? { suma: 0, cuenta: 0, aprobados: 0 };
    actual.suma += it.resultado.calificacion;
    actual.cuenta += 1;
    actual.aprobados += it.resultado.aprobado ? 1 : 0;
    grupos.set(clave, actual);
  }

  const resultado = [...grupos.entries()]
    .map(([nombre, v]) => ({
      nombre,
      promedio: Math.round((v.suma / v.cuenta) * 100) / 100,
      participantes: v.cuenta,
      aprobados: v.aprobados,
    }))
    .sort((a, b) => b.participantes - a.participantes);

  return NextResponse.json(resultado);
}
