import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { requireAdmin } from "@/lib/require-admin";

// GET /api/reportes?formato=excel|csv|pdf|json&examenId=...
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const formato = req.nextUrl.searchParams.get("formato") ?? "csv";
  const examenId = req.nextUrl.searchParams.get("examenId") ?? undefined;

  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO", examenId },
    include: { examen: true, capilla: true, catequista: true, resultado: true },
    orderBy: { finalizadoEn: "desc" },
  });

  const filas = intentos.map((it) => ({
    Nombre: it.nombreCompleto,
    Edad: it.edad,
    Sexo: it.sexo ?? "",
    Capilla: it.capilla?.nombre ?? "",
    Catequista: it.catequista?.nombre ?? "",
    Sacramento: it.grupo ?? "",
    Examen: it.examen.titulo,
    Calificacion: it.resultado?.calificacion ?? "",
    Aprobado: it.resultado?.aprobado ? "Sí" : "No",
    TiempoSegundos: it.tiempoSegundos ?? "",
    CambiosDePantalla: it.cambiosFoco ?? 0,
    Fecha: it.finalizadoEn?.toISOString().slice(0, 10) ?? "",
  }));

  if (formato === "json") return NextResponse.json(filas);

  if (formato === "csv") {
    const encabezados = Object.keys(filas[0] ?? { Nombre: "" }).join(",");
    const cuerpo = filas.map((f) => Object.values(f).join(",")).join("\n");
    return new NextResponse(`${encabezados}\n${cuerpo}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="reporte.csv"',
      },
    });
  }

  if (formato === "excel") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas);
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="reporte.xlsx"',
      },
    });
  }

  if (formato === "pdf") {
    const doc = await PDFDocument.create();
    let pagina = doc.addPage([842, 595]);
    const fuente = await doc.embedFont(StandardFonts.Helvetica);
    const fuenteTitulo = await doc.embedFont(StandardFonts.HelveticaBold);
    let y = 550;
    pagina.drawText("Reporte de resultados", { x: 40, y, size: 18, font: fuenteTitulo });
    y -= 30;
    const columnas = ["Nombre", "Capilla", "Catequista", "Calificacion", "Aprobado", "Fecha"];
    pagina.drawText(columnas.join("   |   "), { x: 40, y, size: 9, font: fuenteTitulo, color: rgb(0.3, 0.3, 0.3) });
    y -= 16;
    for (const f of filas) {
      if (y < 40) {
        pagina = doc.addPage([842, 595]);
        y = 550;
      }
      const linea = `${f.Nombre}   |   ${f.Capilla}   |   ${f.Catequista}   |   ${f.Calificacion}   |   ${f.Aprobado}   |   ${f.Fecha}`;
      pagina.drawText(linea, { x: 40, y, size: 8, font: fuente });
      y -= 14;
    }
    const bytes = await doc.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reporte.pdf"',
      },
    });
  }

  return NextResponse.json({ error: "Formato no soportado." }, { status: 400 });
}
