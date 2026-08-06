export type TipoPregunta =
  | "RESPUESTA_UNICA"
  | "SELECCION_MULTIPLE"
  | "VERDADERO_FALSO"
  | "RELACIONAR_COLUMNAS"
  | "ORDENAR_ELEMENTOS"
  | "COMPLETAR_ESPACIOS"
  | "IMAGEN_RESPUESTA"
  | "BASADA_FOTOGRAFIA"
  | "BASADA_AUDIO"
  | "BASADA_VIDEO";

export interface Opcion {
  id: string;
  texto?: string;
  imagenUrl?: string;
  grupo?: "A" | "B"; // para relacionar columnas
  parejaId?: string;
}

export interface Pregunta {
  id: string;
  enunciado: string;
  tipo: TipoPregunta;
  imagenUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  opciones: Opcion[];
  retroalimentacion?: string;
  tiempoRespuestaSegundos?: number | null;
}

export interface Examen {
  id: string;
  titulo: string;
  descripcion?: string;
  imagenPortadaUrl?: string;
  tiempoMaximoMin?: number;
  preguntas: Pregunta[];
  limiteSalidasPantalla?: number | null;
  mensajeCierrePorSalidas?: string | null;
  mensajeEncabezado?: string | null;
  checkboxCorrecta?: number | null;
}

export interface DatosAlumno {
  nombreCompleto: string;
  edad: number | "";
  sexo?: string;
  capilla: string;
  catequista: string;
  grupo?: string;
  nivel?: string;
  parroquia?: string;
}

// respuesta genérica según tipo de pregunta:
// RESPUESTA_UNICA / VERDADERO_FALSO / IMAGEN_RESPUESTA -> string (id opción)
// SELECCION_MULTIPLE -> string[]
// ORDENAR_ELEMENTOS -> string[] (ids en orden elegido)
// RELACIONAR_COLUMNAS -> Record<string,string> (idOpcionA -> idOpcionB)
// COMPLETAR_ESPACIOS -> string
export type ValorRespuesta = string | string[] | Record<string, string> | undefined;

export interface EstadoExamenLocal {
  examenId: string;
  datosAlumno: DatosAlumno | null;
  respuestas: Record<string, ValorRespuesta>;
  preguntaActual: number;
  iniciadoEn: number; // epoch ms
  ordenPreguntas: string[]; // ids en el orden mostrado (aleatorizado o no)
}
