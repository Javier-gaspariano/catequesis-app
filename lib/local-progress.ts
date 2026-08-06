import { EstadoExamenLocal } from "@/types/exam";

const KEY_PREFIX = "catequesis:intento:";

export function claveIntento(examenId: string, nombreCompleto: string) {
  // clave estable por examen + alumno para poder "continuar donde quedó"
  const slug = nombreCompleto.trim().toLowerCase().replace(/\s+/g, "-");
  return `${KEY_PREFIX}${examenId}:${slug}`;
}

export function guardarProgreso(estado: EstadoExamenLocal) {
  if (typeof window === "undefined" || !estado.datosAlumno) return;
  try {
    const clave = claveIntento(estado.examenId, estado.datosAlumno.nombreCompleto);
    window.localStorage.setItem(clave, JSON.stringify(estado));
  } catch {
    // almacenamiento no disponible; se ignora silenciosamente (modo offline extremo)
  }
}

export function cargarProgreso(examenId: string, nombreCompleto: string): EstadoExamenLocal | null {
  if (typeof window === "undefined") return null;
  try {
    const clave = claveIntento(examenId, nombreCompleto);
    const raw = window.localStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as EstadoExamenLocal) : null;
  } catch {
    return null;
  }
}

export function borrarProgreso(examenId: string, nombreCompleto: string) {
  if (typeof window === "undefined") return;
  const clave = claveIntento(examenId, nombreCompleto);
  window.localStorage.removeItem(clave);
}

// Cola simple de sincronización cuando vuelve la conexión.
// En producción esto haría POST/PUT a la API; aquí queda el enganche listo.
export async function sincronizarSiHayConexion(
  estado: EstadoExamenLocal,
  enviar: (estado: EstadoExamenLocal) => Promise<void>
) {
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      await enviar(estado);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
