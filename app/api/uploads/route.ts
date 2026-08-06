import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/require-admin";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// POST /api/uploads (multipart/form-data, campo "file")
// Sube a Vercel Blob (almacenamiento persistente en la nube).
// Requiere la variable de entorno BLOB_READ_WRITE_TOKEN (se crea automáticamente
// al activar "Blob" en Storage dentro del proyecto de Vercel).
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

  try {
    const blob = await put(`uploads/${nombre}`, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        error: `No se pudo subir la imagen: ${(e as Error).message}. Verifica que la variable BLOB_READ_WRITE_TOKEN esté configurada en Vercel.`,
      },
      { status: 500 }
    );
  }
}
