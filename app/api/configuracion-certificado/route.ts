import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/configuracion-certificado -> siempre devuelve (o crea) la fila "default"
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const config = await prisma.configuracionCertificado.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(config);
}

// PATCH /api/configuracion-certificado -> actualiza la fila "default"
export async function PATCH(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const body = await req.json();
  try {
    const config = await prisma.configuracionCertificado.upsert({
      where: { id: "default" },
      update: body,
      create: { id: "default", ...body },
    });
    return NextResponse.json(config);
  } catch (e) {
    return NextResponse.json({ error: `No se pudo guardar: ${(e as Error).message}` }, { status: 400 });
  }
}
