"use client";

import { useEffect, useState } from "react";

interface Pendiente {
  id: string;
  valorJson: string;
  recuperado?: boolean;
  alumno: string;
  examen: string;
  catequista?: string | null;
  capilla?: string | null;
  pregunta: string;
  respuestasCorrectas: (string | null)[];
}

export default function RevisarRespuestas() {
  const [lista, setLista] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/respuestas-pendientes");
    setLista(await res.json());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcar(id: string, correcta: boolean) {
    await fetch("/api/respuestas-pendientes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, correcta }),
    });
    cargar();
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-extrabold text-tinta">Revisar respuestas</h1>
      <p className="mb-6 max-w-2xl text-sm text-tinta-suave">
        Estas respuestas de "completar espacios" se parecen mucho a una respuesta correcta pero tienen
        una posible falta de ortografía (ej. "enjendrado" en vez de "engendrado"). El sistema no las
        marcó automáticamente ni bien ni mal — decide tú si cuentan como correctas.
      </p>

      {cargando && <p className="text-tinta-suave">Cargando...</p>}

      <div className="flex flex-col gap-3">
        {lista.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-tinta-suave">
              {p.examen} · {p.alumno} {p.catequista && `· ${p.catequista}`} {p.capilla && `· ${p.capilla}`}
            </p>
            <p className="mt-1 text-sm font-semibold text-tinta">{p.pregunta}</p>
            <p className="mt-1 text-sm">
              Respondió: <span className="font-bold text-girasol">{p.valorJson}</span>
              {p.recuperado && (
                <span className="ml-2 rounded-full bg-cielo/10 px-2 py-0.5 text-xs font-bold text-cielo">
                  recuperado de reporte
                </span>
              )}
            </p>
            <p className="text-xs text-tinta-suave">
              Respuesta(s) correcta(s): {p.respuestasCorrectas.filter(Boolean).join(" / ")}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => marcar(p.id, true)}
                className="rounded-full bg-hoja/15 px-4 py-1.5 text-xs font-bold text-hoja"
              >
                ✓ Marcar correcta
              </button>
              <button
                onClick={() => marcar(p.id, false)}
                className="rounded-full bg-girasol/10 px-4 py-1.5 text-xs font-bold text-girasol"
              >
                ✗ Marcar incorrecta
              </button>
            </div>
          </div>
        ))}
        {!cargando && lista.length === 0 && (
          <p className="text-sm text-tinta-suave">No hay respuestas pendientes de revisar. 🎉</p>
        )}
      </div>
    </div>
  );
}
