import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO" },
    include: { examen: { select: { titulo: true } }, capilla: true, catequista: true, resultado: true },
    orderBy: { finalizadoEn: "desc" },
  });
  return NextResponse.json(intentos);
}


// POST /api/intentos -> inicia un intento (o retoma uno EN_PROGRESO existente del mismo alumno)
// Acepta capilla/catequista como NOMBRE (texto libre del formulario del alumno);
// si no existen en el catálogo, se crean automáticamente.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { examenId, nombreCompleto, edad, sexo, capilla, catequista, grupo, nivel, checkboxesMarcados } = body;

  if (!examenId || !nombreCompleto || !catequista) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios (nombre, catequista, examen)." },
      { status: 400 }
    );
  }

  const examen = await prisma.examen.findUnique({ where: { id: examenId } });
  if (!examen || examen.estado !== "PUBLICADO") {
    return NextResponse.json({ error: "El examen no está disponible." }, { status: 404 });
  }
  const ahora = new Date();
  if (examen.fechaApertura && ahora < examen.fechaApertura) {
    return NextResponse.json({ error: "El examen aún no está abierto." }, { status: 403 });
  }
  if (examen.fechaCierre && ahora > examen.fechaCierre) {
    return NextResponse.json({ error: "El examen ya cerró." }, { status: 403 });
  }

  const enProgreso = await prisma.intento.findFirst({
    where: { examenId, nombreCompleto, estado: "EN_PROGRESO" },
  });
  if (enProgreso) return NextResponse.json(enProgreso);

  const previos = await prisma.intento.count({
    where: { examenId, nombreCompleto, estado: "FINALIZADO" },
  });
  if (previos >= examen.intentosPermitidos) {
    return NextResponse.json({ error: "Ya alcanzaste el número máximo de intentos." }, { status: 403 });
  }

  let catequistaId: string | undefined;
  if (catequista) {
    const existente = await prisma.catequista.findFirst({ where: { nombre: catequista } });
    catequistaId = existente ? existente.id : (await prisma.catequista.create({ data: { nombre: catequista } })).id;
  }

  let capillaId: string | undefined;
  if (capilla) {
    const existente = await prisma.capilla.findFirst({ where: { nombre: capilla } });
    capillaId = existente ? existente.id : (await prisma.capilla.create({ data: { nombre: capilla } })).id;
  }

  const marcadas: number[] = Array.isArray(checkboxesMarcados) ? checkboxesMarcados : [];
  const lecturaCorrecta = examen.checkboxCorrecta
    ? marcadas.length === 1 && marcadas[0] === examen.checkboxCorrecta
    : null;

  const intento = await prisma.intento.create({
    data: {
      examenId,
      nombreCompleto,
      edad: Number(edad),
      sexo,
      capillaId,
      catequistaId,
      grupo,
      nivel,
      checkboxesMarcados: marcadas,
      lecturaCorrecta,
    },
  });
  return NextResponse.json(intento, { status: 201 });
}
