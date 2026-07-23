import { NextRequest, NextResponse } from "next/server";
import {
  interpretarExcel,
  interpretarCSV,
  interpretarJSON,
  interpretarTextoPlano,
} from "@/lib/carga-masiva";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

// POST /api/carga-masiva  (multipart/form-data, campo "file")
// Devuelve un preview de preguntas interpretadas, SIN guardarlas todavía.
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se envió ningún archivo." }, { status: 400 });

  const nombre = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let preguntas;

    if (nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) {
      preguntas = interpretarExcel(buffer);
    } else if (nombre.endsWith(".csv")) {
      preguntas = interpretarCSV(buffer.toString("utf-8"));
    } else if (nombre.endsWith(".json")) {
      preguntas = interpretarJSON(buffer.toString("utf-8"));
    } else if (nombre.endsWith(".docx")) {
      const mammoth = (await import("mammoth")).default;
      const { value } = await mammoth.extractRawText({ buffer });
      preguntas = interpretarTextoPlano(value);
    } else if (nombre.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const resultado = await parser.getText();
      preguntas = interpretarTextoPlano(resultado.text);
    } else {
      return NextResponse.json(
        { error: "Formato no soportado. Usa Excel, CSV, JSON, Word o PDF." },
        { status: 400 }
      );
    }

    return NextResponse.json({ preguntas, total: preguntas.length });
  } catch (e) {
    return NextResponse.json(
      { error: `No se pudo interpretar el archivo: ${(e as Error).message}` },
      { status: 400 }
    );
  }
}
