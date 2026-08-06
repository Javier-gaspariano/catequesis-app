import { Pregunta, Opcion } from "@prisma/client";

type PreguntaConOpciones = Pregunta & { opciones: Opcion[] };

/** Normaliza texto para comparar respuestas de texto libre: sin acentos, mayúsculas,
 *  espacios extra ni puntuación final. Evita marcar como incorrectas respuestas que
 *  solo difieren en tildes, mayúsculas o espacios (no requiere ninguna librería externa). */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos/diacríticos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // colapsa espacios múltiples
    .replace(/[.,;:!?¿¡]+$/g, ""); // quita puntuación al final
}

/** Compara la respuesta del alumno contra la(s) opción(es) correcta(s) según el tipo de pregunta.
 *  Devuelve boolean, o `null` para "completar espacios" cuando la respuesta se parece mucho a una
 *  correcta pero tiene un error de ortografía (ej. "enjendrado" en vez de "engendrado"): en ese caso
 *  no se marca automáticamente ni bien ni mal, queda pendiente de revisión manual del catequista. */
export function calificarRespuesta(pregunta: PreguntaConOpciones, valor: unknown): boolean | null {
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
      const respuestaAlumno = normalizarTexto(valor);
      const respuestasValidas = pregunta.opciones.map((o) => normalizarTexto(o.texto ?? ""));

      if (respuestasValidas.includes(respuestaAlumno)) return true;
      if (respuestaAlumno === "") return false; // no contestó nada: mal, sin necesidad de revisar

      // cualquier otra cosa queda pendiente de revisión manual del catequista
      // (las respuestas de texto libre varían demasiado para autocalificar con confianza)
      return null;
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
