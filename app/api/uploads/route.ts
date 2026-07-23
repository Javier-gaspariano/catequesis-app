import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/require-admin";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// POST /api/uploads (multipart/form-data, campo "file")
// En producción real: reemplazar por subida a un bucket S3/GCS/Cloudinary.
// Esto sirve para self-hosting simple con Docker + volumen persistente.
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se envió ningún archivo." }, { status: 400 });
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de imagen no permitido." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera 5MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  const nombre = `${randomUUID()}.${ext}`;
  const carpeta = path.join(process.cwd(), "public", "uploads");
  await mkdir(carpeta, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(carpeta, nombre), bytes);

  return NextResponse.json({ url: `/uploads/${nombre}` }, { status: 201 });
}
