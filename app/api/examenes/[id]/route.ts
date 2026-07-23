import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/examenes/:id -> examen listo para presentar al alumno
// (aplica mezcla de preguntas/opciones y selección aleatoria según configuración,
// y OCULTA cuál opción es correcta)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const esAdmin = req.nextUrl.searchParams.get("admin") === "1";

  const examen = await prisma.examen.findUnique({
    where: { id },
    include: {
      preguntas: {
        include: { pregunta: { include: { opciones: true } } },
        orderBy: { orden: "asc" },
      },
    },
  });
  if (!examen) return NextResponse.json({ error: "Examen no encontrado." }, { status: 404 });

  if (esAdmin) {
    const bloqueo = requireAdmin(req);
    if (bloqueo) return bloqueo;
    return NextResponse.json(examen);
  }

  let preguntas = examen.preguntas.map((ep) => ep.pregunta);
  if (examen.mezclarPreguntas) preguntas = barajar(preguntas);
  if (examen.numPreguntasAlAzar && examen.numPreguntasAlAzar < preguntas.length) {
    preguntas = preguntas.slice(0, examen.numPreguntasAlAzar);
  }

  const preguntasSeguras = preguntas.map((p) => ({
    id: p.id,
    enunciado: p.enunciado,
    tipo: p.tipo,
    imagenUrl: p.imagenUrl,
    audioUrl: p.audioUrl,
    videoUrl: p.videoUrl,
    tiempoRespuestaSegundos: p.tiempoRespuestaSegundos,
    opciones: (examen.mezclarRespuestas ? barajar(p.opciones) : p.opciones).map((o) => ({
      id: o.id,
      texto: o.texto,
      imagenUrl: o.imagenUrl,
      grupo: o.grupo,
      // esCorrecta y parejaId NUNCA se envían al cliente
    })),
  }));

  return NextResponse.json({
    id: examen.id,
    titulo: examen.titulo,
    descripcion: examen.descripcion,
    imagenPortadaUrl: examen.imagenPortadaUrl,
    tiempoMaximoMin: examen.tiempoMaximoMin,
    limiteSalidasPantalla: examen.limiteSalidasPantalla,
    mensajeCierrePorSalidas: examen.mensajeCierrePorSalidas,
    mensajeEncabezado: examen.mensajeEncabezado,
    checkboxCorrecta: examen.checkboxCorrecta,
    preguntas: preguntasSeguras,
  });
}

// PATCH /api/examenes/:id -> editar (borrador o publicar/despublicar)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  const body = await req.json();
  const examen = await prisma.examen.update({ where: { id }, data: body });
  return NextResponse.json(examen);
}

// DELETE /api/examenes/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const { id } = await params;
  try {
    await prisma.examen.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: `No se pudo eliminar: ${(e as Error).message}` }, { status: 409 });
  }
}
