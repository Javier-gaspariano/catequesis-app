import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PreguntaInterpretada } from "@/lib/carga-masiva";
import { requireAdmin } from "@/lib/require-admin";

// POST /api/carga-masiva/confirmar  { preguntas: PreguntaInterpretada[] }
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { preguntas } = (await req.json()) as { preguntas: PreguntaInterpretada[] };
  if (!Array.isArray(preguntas) || preguntas.length === 0) {
    return NextResponse.json({ error: "No hay preguntas para importar." }, { status: 400 });
  }

  const creadas = await prisma.$transaction(
    preguntas.map((p) =>
      prisma.pregunta.create({
        data: {
          enunciado: p.enunciado,
          tipo: p.tipo as never,
          tema: p.tema,
          nivel: p.nivel,
          dificultad: p.dificultad,
          retroalimentacion: p.retroalimentacion,
          opciones: {
            create: p.opciones.map((o, i) => ({ texto: o.texto, esCorrecta: o.esCorrecta, orden: i })),
          },
        },
      })
    )
  );

  return NextResponse.json({ importadas: creadas.length });
}
