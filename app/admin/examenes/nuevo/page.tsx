"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoExamen() {
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tiempoMaximoMin: "",
    intentosPermitidos: 1,
    mezclarPreguntas: true,
    mezclarRespuestas: true,
    numPreguntasAlAzar: "",
    escalaCalificacion: "ESCALA_0_100",
    notaAprobatoria: "",
    emiteCertificado: true,
  });
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const res = await fetch("/api/examenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tiempoMaximoMin: form.tiempoMaximoMin ? Number(form.tiempoMaximoMin) : undefined,
        numPreguntasAlAzar: form.numPreguntasAlAzar ? Number(form.numPreguntasAlAzar) : undefined,
        notaAprobatoria: form.notaAprobatoria ? Number(form.notaAprobatoria) : undefined,
      }),
    });
    const examen = await res.json();
    setGuardando(false);
    if (res.ok) router.push(`/admin/examenes/${examen.id}`);
  }

  const campo = "w-full rounded-xl border-2 border-cielo/15 bg-white px-3 py-2 outline-none focus:border-cielo";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-tinta">Nuevo examen</h1>
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-bold text-sm">Título *</span>
          <input
            className={campo}
            required
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold text-sm">Descripción</span>
          <textarea
            className={campo}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-bold text-sm">Tiempo máximo (min)</span>
            <input
              type="number"
              className={campo}
              value={form.tiempoMaximoMin}
              onChange={(e) => setForm({ ...form, tiempoMaximoMin: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-sm">Intentos permitidos</span>
            <input
              type="number"
              min={1}
              className={campo}
              value={form.intentosPermitidos}
              onChange={(e) => setForm({ ...form, intentosPermitidos: Number(e.target.value) })}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-bold text-sm"># preguntas al azar (vacío = todas del banco asignado)</span>
          <input
            type="number"
            className={campo}
            value={form.numPreguntasAlAzar}
            onChange={(e) => setForm({ ...form, numPreguntasAlAzar: e.target.value })}
          />
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 font-semibold text-sm">
            <input
              type="checkbox"
              checked={form.mezclarPreguntas}
              onChange={(e) => setForm({ ...form, mezclarPreguntas: e.target.checked })}
            />
            Mezclar preguntas
          </label>
          <label className="flex items-center gap-2 font-semibold text-sm">
            <input
              type="checkbox"
              checked={form.mezclarRespuestas}
              onChange={(e) => setForm({ ...form, mezclarRespuestas: e.target.checked })}
            />
            Mezclar respuestas
          </label>
          <label className="flex items-center gap-2 font-semibold text-sm">
            <input
              type="checkbox"
              checked={form.emiteCertificado}
              onChange={(e) => setForm({ ...form, emiteCertificado: e.target.checked })}
            />
            Emitir certificado a los aprobados
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-bold text-sm">Escala</span>
            <select
              className={campo}
              value={form.escalaCalificacion}
              onChange={(e) => setForm({ ...form, escalaCalificacion: e.target.value })}
            >
              <option value="ESCALA_0_100">0 - 100</option>
              <option value="ESCALA_0_10">0 - 10</option>
              <option value="APROBADO_NOAPROBADO">Aprobado / No aprobado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-sm">Nota aprobatoria</span>
            <input
              type="number"
              className={campo}
              placeholder="Ej. 60"
              value={form.notaAprobatoria}
              onChange={(e) => setForm({ ...form, notaAprobatoria: e.target.value })}
            />
          </label>
        </div>
        <button
          disabled={guardando}
          className="mt-2 rounded-full bg-cielo px-6 py-3 font-display font-extrabold text-white hover:bg-cielo-oscuro disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Crear examen (borrador)"}
        </button>
      </form>
    </div>
  );
}
