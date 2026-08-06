import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/examenes  -> lista exámenes publicados (o todos si ?admin=1, requiere sesión)
export async function GET(req: NextRequest) {
  const quiereAdmin = req.nextUrl.searchParams.get("admin") === "1";
  if (quiereAdmin) {
    const bloqueo = requireAdmin(req);
    if (bloqueo) return bloqueo;
  }
  const examenes = await prisma.examen.findMany({
    where: quiereAdmin ? undefined : { estado: "PUBLICADO" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { preguntas: true, intentos: true } } },
  });
  return NextResponse.json(examenes);
}

// POST /api/examenes -> crea examen (borrador)
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const body = await req.json();
  if (!body.titulo) {
    return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  }
  const examen = await prisma.examen.create({
    data: {
      titulo: body.titulo,
      descripcion: body.descripcion,
      imagenPortadaUrl: body.imagenPortadaUrl,
      parroquiaId: body.parroquiaId,
      tiempoMaximoMin: body.tiempoMaximoMin,
      intentosPermitidos: body.intentosPermitidos ?? 1,
      mezclarPreguntas: body.mezclarPreguntas ?? true,
      mezclarRespuestas: body.mezclarRespuestas ?? true,
      numPreguntasAlAzar: body.numPreguntasAlAzar,
      escalaCalificacion: body.escalaCalificacion ?? "ESCALA_0_100",
      notaAprobatoria: body.notaAprobatoria,
      creadoPorId: body.creadoPorId,
    },
  });
  return NextResponse.json(examen, { status: 201 });
}
