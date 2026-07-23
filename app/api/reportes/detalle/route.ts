import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/require-admin";

import { Opcion, TipoPregunta } from "@prisma/client";

function resumirValor(tipo: TipoPregunta, valorJson: unknown, opciones: Opcion[]): string {
  if (valorJson === null || valorJson === undefined || valorJson === "") return "";

  const textoDe = (id: string) => opciones.find((o) => o.id === id)?.texto ?? id;

  switch (tipo) {
    case "RESPUESTA_UNICA":
    case "VERDADERO_FALSO":
    case "IMAGEN_RESPUESTA":
    case "BASADA_FOTOGRAFIA":
    case "BASADA_AUDIO":
    case "BASADA_VIDEO":
      return typeof valorJson === "string" ? textoDe(valorJson) : String(valorJson);

    case "SELECCION_MULTIPLE":
      return Array.isArray(valorJson) ? valorJson.map((id: string) => textoDe(id)).join(", ") : String(valorJson);

    case "ORDENAR_ELEMENTOS":
      return Array.isArray(valorJson) ? valorJson.map((id: string) => textoDe(id)).join(" → ") : String(valorJson);

    case "RELACIONAR_COLUMNAS":
      if (typeof valorJson !== "object" || Array.isArray(valorJson)) return "";
      return Object.entries(valorJson as Record<string, string>)
        .map(([idA, idB]) => `${textoDe(idA)} → ${textoDe(idB)}`)
        .join(" | ");

    case "COMPLETAR_ESPACIOS":
      return typeof valorJson === "string" ? valorJson : String(valorJson);

    default:
      return typeof valorJson === "string" ? valorJson : JSON.stringify(valorJson);
  }
}

function resumirEventosFoco(eventosFoco: unknown): string {
  if (!Array.isArray(eventosFoco) || eventosFoco.length === 0) return "";
  return eventosFoco
    .map((e: { preguntaNumero?: number; preguntaEnunciado?: string }) =>
      e.preguntaNumero ? `Pregunta ${e.preguntaNumero}` : ""
    )
    .filter(Boolean)
    .join(", ");
}

function formatearMinutos(segundos: number | null): string {
  if (!segundos) return "";
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// GET /api/reportes/detalle?formato=excel|csv|json&examenId=
export async function GET(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const formato = req.nextUrl.searchParams.get("formato") ?? "excel";
  const examenId = req.nextUrl.searchParams.get("examenId") ?? undefined;

  const intentos = await prisma.intento.findMany({
    where: { estado: "FINALIZADO", examenId },
    include: {
      examen: true,
      capilla: true,
      catequista: true,
      resultado: true,
      respuestas: { include: { pregunta: { include: { opciones: true } } } },
    },
    orderBy: { finalizadoEn: "desc" },
  });

  const filas: Record<string, unknown>[] = [];
  for (const it of intentos) {
    const salioDePantalla = it.cambiosFoco > 0 ? "Sí" : "No";
    const preguntasDondeSalio = resumirEventosFoco(it.eventosFoco);
    for (const r of it.respuestas) {
      filas.push({
        Nombre: it.nombreCompleto,
        Sacramento: it.grupo ?? "",
        Capilla: it.capilla?.nombre ?? "",
        Catequista: it.catequista?.nombre ?? "",
        Examen: it.examen.titulo,
        Pregunta: r.pregunta.enunciado,
        RespuestaDada: resumirValor(r.pregunta.tipo, r.valorJson, r.pregunta.opciones),
        EsCorrecta: r.esCorrecta === null ? "" : r.esCorrecta ? "Sí" : "No",
        CalificacionFinal: it.resultado?.calificacion ?? "",
        Aprobado: it.resultado?.aprobado ? "Sí" : "No",
        TiempoTotalMinutos: formatearMinutos(it.tiempoSegundos),
        SalioDePantalla: salioDePantalla,
        PreguntasDondeSalio: preguntasDondeSalio,
        Fecha: it.finalizadoEn?.toISOString().slice(0, 10) ?? "",
      });
    }
  }

  if (formato === "json") return NextResponse.json(filas);

  if (formato === "csv") {
    const encabezados = Object.keys(filas[0] ?? { Nombre: "" }).join(",");
    const cuerpo = filas
      .map((f) =>
        Object.values(f)
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    return new NextResponse(`${encabezados}\n${cuerpo}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="reporte-detallado.csv"',
      },
    });
  }

  // excel (default)
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filas);
  XLSX.utils.book_append_sheet(wb, ws, "Detalle");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="reporte-detallado.xlsx"',
    },
  });
}
