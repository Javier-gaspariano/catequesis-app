import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarCertificadoPDF } from "@/lib/certificado";

// GET /api/certificados/:id -> descarga el PDF del certificado (id = intentoId)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const intento = await prisma.intento.findUnique({
    where: { id },
    include: { examen: true, capilla: true, catequista: true, resultado: true, certificado: true },
  });

  if (!intento || !intento.resultado?.aprobado || !intento.certificado) {
    return NextResponse.json({ error: "No hay certificado disponible para este intento." }, { status: 404 });
  }

  const origen = req.nextUrl.origin;
  const pdfBytes = await generarCertificadoPDF({
    nombreAlumno: intento.nombreCompleto,
    nombreExamen: intento.examen.titulo,
    catequista: intento.catequista?.nombre,
    capilla: intento.capilla?.nombre,
    calificacion: intento.resultado.calificacion,
    fecha: intento.certificado.emitidoEn,
    folio: intento.certificado.folio,
    urlValidacion: `${origen}/validar/${intento.certificado.folio}`,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${intento.certificado.folio}.pdf"`,
    },
  });
}
