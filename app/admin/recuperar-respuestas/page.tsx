"use client";

import { useState } from "react";

interface NoEncontrada {
  fila: number;
  motivo: string;
  nombre?: string;
  pregunta?: string;
}

export default function RecuperarRespuestas() {
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{ total: number; actualizadas: number; noEncontradas: NoEncontrada[] } | null>(
    null
  );
  const [error, setError] = useState("");

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcesando(true);
    setError("");
    setResultado(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/recuperar-respuestas", { method: "POST", body: form });
    const data = await res.json();
    setProcesando(false);
    if (res.ok) setResultado(data);
    else setError(data.error ?? "No se pudo procesar el archivo.");
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-extrabold text-tinta">Recuperar respuestas</h1>
      <p className="mb-2 max-w-2xl text-sm text-tinta-suave">
        Si tienes descargado el archivo "Reporte detallado (por pregunta)" de antes de editar tus preguntas,
        súbelo aquí. El sistema buscará, por cada fila (alumno + examen + pregunta), la respuesta
        correspondiente y recuperará el texto que aparece en el archivo.
      </p>
      <p className="mb-6 max-w-2xl text-sm text-tinta-suave">
        Las respuestas recuperadas quedarán marcadas como pendientes de revisar en "❓ Revisar respuestas" —
        tendrás que confirmar una por una si están bien o mal, ya que el sistema no puede recalificarlas
        automáticamente.
      </p>

      <label className="mb-4 flex w-fit cursor-pointer items-center gap-2 rounded-full bg-cielo px-6 py-3 font-display font-bold text-white hover:bg-cielo-oscuro">
        {procesando ? "Procesando..." : "⬆️ Seleccionar archivo (Excel o CSV)"}
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={subir} />
      </label>

      {error && <p className="mb-4 font-semibold text-girasol">{error}</p>}

      {resultado && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-bold text-tinta">
            {resultado.actualizadas} de {resultado.total} filas recuperadas correctamente.
          </p>
          {resultado.noEncontradas.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-sm font-bold text-girasol">
                {resultado.noEncontradas.length} filas no se pudieron emparejar:
              </p>
              <div className="flex max-h-96 flex-col gap-1 overflow-y-auto text-xs text-tinta-suave">
                {resultado.noEncontradas.map((n, i) => (
                  <p key={i}>
                    Fila {n.fila}: {n.motivo} {n.nombre && `(${n.nombre}${n.pregunta ? ` · ${n.pregunta}` : ""})`}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
