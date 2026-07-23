import { Pregunta, Opcion } from "@prisma/client";

type PreguntaConOpciones = Pregunta & { opciones: Opcion[] };

/** Compara la respuesta del alumno contra la(s) opción(es) correcta(s) según el tipo de pregunta. */
export function calificarRespuesta(pregunta: PreguntaConOpciones, valor: unknown): boolean {
  const correctas = pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.id);

  switch (pregunta.tipo) {
    case "RESPUESTA_UNICA":
    case "VERDADERO_FALSO":
    case "IMAGEN_RESPUESTA":
      return typeof valor === "string" && correctas.includes(valor);

    case "SELECCION_MULTIPLE": {
      if (!Array.isArray(valor)) return false;
      const seleccion = [...valor].sort();
      const esperado = [...correctas].sort();
      return seleccion.length === esperado.length && seleccion.every((v, i) => v === esperado[i]);
    }

    case "ORDENAR_ELEMENTOS": {
      if (!Array.isArray(valor)) return false;
      const ordenEsperado = pregunta.opciones.sort((a, b) => a.orden - b.orden).map((o) => o.id);
      return valor.length === ordenEsperado.length && valor.every((v, i) => v === ordenEsperado[i]);
    }

    case "RELACIONAR_COLUMNAS": {
      if (typeof valor !== "object" || valor === null) return false;
      const parejas: Record<string, string> = valor as Record<string, string>;
      const opcionesA = pregunta.opciones.filter((o) => o.grupo === "A");
      const opcionesB = pregunta.opciones.filter((o) => o.grupo === "B");
      return opcionesA.every((a) => {
        const correctaB = opcionesB.find((b) => b.orden === a.orden);
        return !!correctaB && parejas[a.id] === correctaB.id;
      });
    }

    case "COMPLETAR_ESPACIOS": {
      if (typeof valor !== "string") return false;
      const respuestasValidas = pregunta.opciones.map((o) => (o.texto ?? "").trim().toLowerCase());
      return respuestasValidas.includes(valor.trim().toLowerCase());
    }

    default:
      return false;
  }
}

export function calcularCalificacion(
  aciertos: number,
  total: number,
  escala: "ESCALA_0_10" | "ESCALA_0_100" | "APROBADO_NOAPROBADO",
  notaAprobatoria?: number | null
) {
  const porcentaje = total > 0 ? (aciertos / total) * 100 : 0;
  let calificacion: number;
  switch (escala) {
    case "ESCALA_0_10":
      calificacion = Math.round((porcentaje / 10) * 100) / 100;
      break;
    case "APROBADO_NOAPROBADO":
      calificacion = porcentaje;
      break;
    default:
      calificacion = Math.round(porcentaje * 100) / 100;
  }
  const umbral = notaAprobatoria ?? (escala === "ESCALA_0_10" ? 6 : 60);
  const referencia = escala === "ESCALA_0_10" ? calificacion : porcentaje;
  const aprobado = referencia >= umbral;
  return { porcentaje, calificacion, aprobado };
}
