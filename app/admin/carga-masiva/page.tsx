"use client";

import { useState } from "react";
import { PreguntaInterpretada } from "@/lib/carga-masiva";

export default function CargaMasiva() {
  const [preview, setPreview] = useState<PreguntaInterpretada[] | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcesando(true);
    setMensaje("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/carga-masiva", { method: "POST", body: form });
    const data = await res.json();
    setProcesando(false);
    if (res.ok) setPreview(data.preguntas);
    else setMensaje(data.error);
  }

  async function confirmar() {
    if (!preview) return;
    setProcesando(true);
    const res = await fetch("/api/carga-masiva/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preguntas: preview }),
    });
    const data = await res.json();
    setProcesando(false);
    if (res.ok) {
      setMensaje(`✅ ${data.importadas} preguntas importadas al banco.`);
      setPreview(null);
    } else {
      setMensaje(data.error);
    }
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-extrabold text-tinta">Carga masiva de preguntas</h1>
      <p className="mb-6 text-tinta-suave">
        Formatos aceptados: Excel (.xlsx), CSV, JSON, Word (.docx) y PDF. Revisa el preview antes de
        confirmar la importación.
      </p>

      <label className="mb-4 flex w-fit cursor-pointer items-center gap-2 rounded-full bg-cielo px-6 py-3 font-display font-bold text-white hover:bg-cielo-oscuro">
        {procesando ? "Procesando..." : "⬆️ Seleccionar archivo"}
        <input
          type="file"
          accept=".xlsx,.xls,.csv,.json,.docx,.pdf"
          className="hidden"
          onChange={subir}
        />
      </label>

      {mensaje && <p className="mb-4 font-semibold text-tinta">{mensaje}</p>}

      {preview && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-tinta">{preview.length} preguntas detectadas</p>
            <button
              onClick={confirmar}
              disabled={procesando}
              className="rounded-full bg-hoja px-6 py-2.5 font-display font-extrabold text-white disabled:opacity-50"
            >
              Confirmar e importar
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {preview.map((p, i) => (
              <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-tinta">{p.enunciado}</p>
                <ul className="mt-1 flex flex-wrap gap-2 text-xs">
                  {p.opciones.map((o, j) => (
                    <li
                      key={j}
                      className={`rounded-full px-2 py-0.5 ${
                        o.esCorrecta ? "bg-hoja/20 text-hoja font-bold" : "bg-tinta-suave/10 text-tinta-suave"
                      }`}
                    >
                      {o.texto}
                    </li>
                  ))}
                </ul>
                {p.opciones.every((o) => !o.esCorrecta) && (
                  <p className="mt-1 text-xs font-bold text-girasol">
                    ⚠ No se detectó respuesta correcta — revisar manualmente después de importar.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
