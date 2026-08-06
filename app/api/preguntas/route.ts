import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/preguntas?tema=&nivel=&dificultad=&tipo=&q=
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};
  for (const campo of ["tema", "nivel", "dificultad", "sacramento", "bloque"]) {
    const v = sp.get(campo);
    if (v) where[campo] = v;
  }
  const tipo = sp.get("tipo");
  if (tipo) where.tipo = tipo;
  const q = sp.get("q");
  if (q) where.enunciado = { contains: q, mode: "insensitive" };

  const preguntas = await prisma.pregunta.findMany({
    where,
    include: { opciones: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(preguntas);
}

// POST /api/preguntas -> crea pregunta manual con sus opciones
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const body = await req.json();
  if (!body.enunciado || !body.tipo) {
    return NextResponse.json({ error: "Enunciado y tipo son obligatorios." }, { status: 400 });
  }
  const pregunta = await prisma.pregunta.create({
    data: {
      enunciado: body.enunciado,
      tipo: body.tipo,
      imagenUrl: body.imagenUrl,
      audioUrl: body.audioUrl,
      videoUrl: body.videoUrl,
      tema: body.tema,
      sacramento: body.sacramento,
      bloque: body.bloque,
      nivel: body.nivel,
      edadObjetivo: body.edadObjetivo,
      dificultad: body.dificultad,
      etiquetas: body.etiquetas ?? [],
      catequistaId: body.catequistaId,
      retroalimentacion: body.retroalimentacion,
      tiempoRespuestaSegundos: body.tiempoRespuestaSegundos ?? null,
      versiculo: body.versiculo,
      referenciaCatecismo: body.referenciaCatecismo,
      opciones: {
        create: (body.opciones ?? []).map((o: Record<string, unknown>, i: number) => ({
          texto: o.texto,
          imagenUrl: o.imagenUrl,
          esCorrecta: !!o.esCorrecta,
          orden: typeof o.orden === "number" ? o.orden : i,
          grupo: o.grupo,
          parejaId: o.parejaId,
        })),
      },
    },
    include: { opciones: true },
  });
  return NextResponse.json(pregunta, { status: 201 });
}
