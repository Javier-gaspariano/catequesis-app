import { Opcion, TipoPregunta } from "@prisma/client";

export function resumirValorRespuesta(
  tipo: TipoPregunta,
  valorJson: unknown,
  opciones: Opcion[],
  valorRecuperadoTexto?: string | null
): string {
  // si esta respuesta fue recuperada manualmente desde un reporte descargado
  // (porque la pregunta se editó y el ID original de la opción ya no existe), usar ese texto
  if (valorRecuperadoTexto) return `${valorRecuperadoTexto} (recuperado de reporte)`;

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
