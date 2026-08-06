import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export const runtime = "nodejs";

interface FilaReporte {
  Nombre?: string;
  Examen?: string;
  Pregunta?: string;
  RespuestaDada?: string;
  Fecha?: string;
}

function leerFilas(nombreArchivo: string, buffer: Buffer): FilaReporte[] {
  if (nombreArchivo.toLowerCase().endsWith(".csv")) {
    const { data } = Papa.parse<FilaReporte>(buffer.toString("utf-8"), { header: true, skipEmptyLines: true });
    return data;
  }
  const wb = XLSX.read(buffer, { type: "buffer" });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<FilaReporte>(hoja, { defval: "" });
}

// POST /api/recuperar-respuestas (multipart/form-data, campo "file")
// Espera el archivo del "Reporte detallado (por pregunta)" descargado previamente desde Estadísticas.
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se envió ningún archivo." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let filas: FilaReporte[];
  try {
    filas = leerFilas(file.name, buffer);
  } catch (e) {
    return NextResponse.json({ error: `No se pudo leer el archivo: ${(e as Error).message}` }, { status: 400 });
  }

  let actualizadas = 0;
  const noEncontradas: { fila: number; motivo: string; nombre?: string; pregunta?: string }[] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const nombre = (fila.Nombre ?? "").trim();
    const examenTitulo = (fila.Examen ?? "").trim();
    const preguntaEnunciado = (fila.Pregunta ?? "").trim();
    const respuestaDada = (fila.RespuestaDada ?? "").trim();

    if (!nombre || !examenTitulo || !preguntaEnunciado) {
      noEncontradas.push({ fila: i + 2, motivo: "Faltan columnas (Nombre/Examen/Pregunta) en esta fila." });
      continue;
    }

    const examen = await prisma.examen.findFirst({ where: { titulo: examenTitulo } });
    if (!examen) {
      noEncontradas.push({ fila: i + 2, motivo: `No existe un examen llamado "${examenTitulo}".`, nombre });
      continue;
    }

    const intento = await prisma.intento.findFirst({
      where: { examenId: examen.id, nombreCompleto: nombre, estado: "FINALIZADO" },
      orderBy: { finalizadoEn: "desc" },
    });
    if (!intento) {
      noEncontradas.push({ fila: i + 2, motivo: "No se encontró el examen contestado de este alumno.", nombre });
      continue;
    }

    const pregunta = await prisma.pregunta.findFirst({
      where: { enunciado: preguntaEnunciado, examenPreguntas: { some: { examenId: examen.id } } },
    });
    if (!pregunta) {
      noEncontradas.push({
        fila: i + 2,
        motivo: "No se encontró esa pregunta en el examen (puede que haya sido editada o eliminada).",
        nombre,
        pregunta: preguntaEnunciado,
      });
      continue;
    }

    const respuesta = await prisma.respuesta.findUnique({
      where: { intentoId_preguntaId: { intentoId: intento.id, preguntaId: pregunta.id } },
    });
    if (!respuesta) {
      noEncontradas.push({ fila: i + 2, motivo: "No hay respuesta registrada para esa pregunta.", nombre, pregunta: preguntaEnunciado });
      continue;
    }

    await prisma.respuesta.update({
      where: { id: respuesta.id },
      data: {
        valorRecuperadoTexto: respuestaDada,
        esCorrecta: null,
        revisadoManualmente: false,
      },
    });
    actualizadas += 1;
  }

  return NextResponse.json({ total: filas.length, actualizadas, noEncontradas });
}
