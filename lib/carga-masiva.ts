import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface OpcionInterpretada {
  texto: string;
  esCorrecta: boolean;
}

export interface PreguntaInterpretada {
  enunciado: string;
  tipo: string;
  opciones: OpcionInterpretada[];
  retroalimentacion?: string;
  tema?: string;
  nivel?: string;
  dificultad?: string;
}

// ---------- Excel / CSV ----------
// Convención de columnas esperada:
// enunciado | tipo | opcion1 | opcion2 | opcion3 | opcion4 | opcion5 | opcion6 | correcta | retroalimentacion | tema | nivel | dificultad
// "correcta" acepta: el texto exacto de la opción correcta, o el número de columna (1-6), o varias separadas por coma (selección múltiple)
function filaATexto(v: unknown): string {
  return v === undefined || v === null ? "" : String(v).trim();
}

function interpretarFilas(filas: Record<string, unknown>[]): PreguntaInterpretada[] {
  return filas
    .filter((f) => filaATexto(f.enunciado))
    .map((f) => {
      const opcionesTexto = [1, 2, 3, 4, 5, 6]
        .map((i) => filaATexto(f[`opcion${i}`]))
        .filter((t) => t !== "");

      const correctaRaw = filaATexto(f.correcta);
      const indicesCorrectos = new Set(
        correctaRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );

      const opciones: OpcionInterpretada[] = opcionesTexto.map((texto, i) => {
        const numColumna = String(i + 1);
        const esCorrecta =
          indicesCorrectos.has(numColumna) ||
          [...indicesCorrectos].some((c) => c.toLowerCase() === texto.toLowerCase());
        return { texto, esCorrecta };
      });

      const tipo =
        filaATexto(f.tipo) ||
        (opciones.filter((o) => o.esCorrecta).length > 1 ? "SELECCION_MULTIPLE" : "RESPUESTA_UNICA");

      return {
        enunciado: filaATexto(f.enunciado),
        tipo: tipo.toUpperCase().replaceAll(" ", "_"),
        opciones,
        retroalimentacion: filaATexto(f.retroalimentacion) || undefined,
        tema: filaATexto(f.tema) || undefined,
        nivel: filaATexto(f.nivel) || undefined,
        dificultad: filaATexto(f.dificultad) || undefined,
      };
    });
}

export function interpretarExcel(buffer: Buffer): PreguntaInterpretada[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" });
  return interpretarFilas(filas);
}

export function interpretarCSV(texto: string): PreguntaInterpretada[] {
  const { data } = Papa.parse<Record<string, unknown>>(texto, { header: true, skipEmptyLines: true });
  return interpretarFilas(data);
}

// ---------- JSON ----------
// Acepta un array de preguntas ya estructuradas (o las envuelve en { preguntas: [...] })
export function interpretarJSON(texto: string): PreguntaInterpretada[] {
  const data = JSON.parse(texto);
  const arreglo = Array.isArray(data) ? data : data.preguntas ?? [];
  return arreglo
    .filter((p: Record<string, unknown>) => p.enunciado)
    .map((p: Record<string, unknown>) => ({
      enunciado: String(p.enunciado),
      tipo: String(p.tipo ?? "RESPUESTA_UNICA").toUpperCase(),
      opciones: (Array.isArray(p.opciones) ? p.opciones : []).map((o: Record<string, unknown>) => ({
        texto: String(o.texto ?? ""),
        esCorrecta: !!o.esCorrecta,
      })),
      retroalimentacion: p.retroalimentacion ? String(p.retroalimentacion) : undefined,
      tema: p.tema ? String(p.tema) : undefined,
      nivel: p.nivel ? String(p.nivel) : undefined,
      dificultad: p.dificultad ? String(p.dificultad) : undefined,
    }));
}

// ---------- Texto plano (usado por Word/PDF tras extracción) ----------
// Convención en el documento:
//   1. Enunciado de la pregunta
//   a) Opción 1
//   *b) Opción correcta (marcada con asterisco)
//   c) Opción 3
//   Retroalimentación: texto opcional
export function interpretarTextoPlano(texto: string): PreguntaInterpretada[] {
  const lineas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const preguntas: PreguntaInterpretada[] = [];
  let actual: PreguntaInterpretada | null = null;

  const regexPregunta = /^\d+[.).-]\s*(.+)/;
  const regexOpcion = /^(\*?)[a-zA-Z][.).-]\s*(.+)/;
  const regexRetro = /^retroalimentaci[oó]n\s*[:.-]\s*(.+)/i;

  for (const linea of lineas) {
    const mPregunta = linea.match(regexPregunta);
    const mOpcion = linea.match(regexOpcion);
    const mRetro = linea.match(regexRetro);

    if (mRetro && actual) {
      actual.retroalimentacion = mRetro[1].trim();
    } else if (mOpcion && actual) {
      actual.opciones.push({ texto: mOpcion[2].trim(), esCorrecta: mOpcion[1] === "*" });
    } else if (mPregunta) {
      if (actual) preguntas.push(actual);
      actual = { enunciado: mPregunta[1].trim(), tipo: "RESPUESTA_UNICA", opciones: [] };
    }
  }
  if (actual) preguntas.push(actual);

  // si nadie marcó una opción correcta, no se asume ninguna (queda pendiente de revisión manual)
  return preguntas.filter((p) => p.opciones.length > 0);
}
