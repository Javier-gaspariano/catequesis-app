import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/estadisticas/coincidencias
// Agrupa, por examen, a los alumnos que obtuvieron el MISMO número de aciertos.
// Además marca "patronIdentico" si, dentro de ese grupo, dos o más alumnos respondieron
// exactamente lo mismo en TODAS las preguntas (indicio más fuerte de posible copia).
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;

  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO" },
    include: {
      examen: { select: { titulo: true } },
      resultado: true,
      respuestas: { orderBy: { preguntaId: "asc" }, select: { preguntaId: true, valorJson: true } },
    },
  });

  const porExamen = new Map<string, typeof intentos>();
  for (const it of intentos) {
    if (!it.resultado) continue;
    const lista = porExamen.get(it.examen.titulo) ?? [];
    lista.push(it);
    porExamen.set(it.examen.titulo, lista);
  }

  const resultado: {
    examen: string;
    aciertos: number;
    alumnos: { id: string; nombreCompleto: string }[];
    patronIdentico: boolean;
  }[] = [];

  for (const [examen, lista] of porExamen.entries()) {
    const porAciertos = new Map<number, typeof lista>();
    for (const it of lista) {
      const grupo = porAciertos.get(it.resultado!.aciertos) ?? [];
      grupo.push(it);
      porAciertos.set(it.resultado!.aciertos, grupo);
    }
    for (const [aciertos, grupo] of porAciertos.entries()) {
      if (grupo.length < 2) continue;
      const firmas = grupo.map((it) => JSON.stringify(it.respuestas.map((r) => r.valorJson)));
      const patronIdentico = new Set(firmas).size < firmas.length;
      resultado.push({
        examen,
        aciertos,
        alumnos: grupo.map((it) => ({ id: it.id, nombreCompleto: it.nombreCompleto })),
        patronIdentico,
      });
    }
  }

  resultado.sort(
    (a, b) => (b.patronIdentico ? 1 : 0) - (a.patronIdentico ? 1 : 0) || b.alumnos.length - a.alumnos.length
  );

  return NextResponse.json(resultado);
}
