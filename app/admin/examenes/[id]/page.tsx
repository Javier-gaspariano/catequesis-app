"use client";

import { useEffect, useState, use as usePromise } from "react";

interface Pregunta {
  id: string;
  enunciado: string;
  tipo: string;
  imagenUrl?: string | null;
  tema?: string | null;
}

interface ExamenCompleto {
  titulo: string;
  descripcion?: string | null;
  estado: string;
  emiteCertificado: boolean;
  tiempoMaximoMin?: number | null;
  intentosPermitidos: number;
  mezclarPreguntas: boolean;
  mezclarRespuestas: boolean;
  numPreguntasAlAzar?: number | null;
  escalaCalificacion: string;
  notaAprobatoria?: number | null;
  limiteSalidasPantalla?: number | null;
  mensajeCierrePorSalidas?: string | null;
  mensajeEncabezado?: string | null;
  checkboxCorrecta?: number | null;
}

export default function EditarExamen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [examen, setExamen] = useState<ExamenCompleto | null>(null);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [asignadas, setAsignadas] = useState<{ preguntaId: string; pregunta: Pregunta }[]>([]);
  const [banco, setBanco] = useState<Pregunta[]>([]);
  const [busqueda, setBusqueda] = useState("");

  async function cargarTodo() {
    const [ex, asign, preguntas] = await Promise.all([
      fetch(`/api/examenes/${id}?admin=1`).then((r) => r.json()),
      fetch(`/api/examenes/${id}/preguntas`).then((r) => r.json()),
      fetch(`/api/preguntas${busqueda ? `?q=${encodeURIComponent(busqueda)}` : ""}`).then((r) => r.json()),
    ]);
    setExamen(ex);
    setAsignadas(asign);
    setBanco(preguntas);
  }

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const idsAsignadas = new Set(asignadas.map((a) => a.preguntaId));

  async function asignar(preguntaId: string) {
    await fetch(`/api/examenes/${id}/preguntas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preguntaId }),
    });
    cargarTodo();
  }

  async function quitar(preguntaId: string) {
    await fetch(`/api/examenes/${id}/preguntas?preguntaId=${preguntaId}`, { method: "DELETE" });
    cargarTodo();
  }

  async function guardarConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!examen) return;
    setGuardandoConfig(true);
    await fetch(`/api/examenes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(examen),
    });
    setGuardandoConfig(false);
    setMostrarConfig(false);
  }

  if (!examen) return <p className="text-tinta-suave">Cargando...</p>;

  const campo = "w-full rounded-xl border-2 border-cielo/15 bg-white px-3 py-2 outline-none focus:border-cielo";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-tinta">{examen.titulo}</h1>
        <button
          onClick={() => setMostrarConfig((v) => !v)}
          className="rounded-full bg-cielo/10 px-4 py-1.5 text-sm font-bold text-cielo"
        >
          {mostrarConfig ? "Cerrar edición" : "✏ Editar configuración"}
        </button>
      </div>
      <p className="mb-4 text-sm font-bold text-tinta-suave">Estado: {examen.estado}</p>

      {mostrarConfig && (
        <form onSubmit={guardarConfig} className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Título</span>
            <input
              className={campo}
              value={examen.titulo}
              onChange={(e) => setExamen({ ...examen, titulo: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Descripción</span>
            <textarea
              className={campo}
              value={examen.descripcion ?? ""}
              onChange={(e) => setExamen({ ...examen, descripcion: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Tiempo máximo (min)</span>
              <input
                type="number"
                className={campo}
                value={examen.tiempoMaximoMin ?? ""}
                onChange={(e) =>
                  setExamen({ ...examen, tiempoMaximoMin: e.target.value ? Number(e.target.value) : null })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Intentos permitidos</span>
              <input
                type="number"
                min={1}
                className={campo}
                value={examen.intentosPermitidos}
                onChange={(e) => setExamen({ ...examen, intentosPermitidos: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold"># preguntas al azar (vacío = todas las asignadas)</span>
            <input
              type="number"
              className={campo}
              value={examen.numPreguntasAlAzar ?? ""}
              onChange={(e) =>
                setExamen({ ...examen, numPreguntasAlAzar: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={examen.mezclarPreguntas}
                onChange={(e) => setExamen({ ...examen, mezclarPreguntas: e.target.checked })}
              />
              Mezclar preguntas
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={examen.mezclarRespuestas}
                onChange={(e) => setExamen({ ...examen, mezclarRespuestas: e.target.checked })}
              />
              Mezclar respuestas
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Escala</span>
              <select
                className={campo}
                value={examen.escalaCalificacion}
                onChange={(e) => setExamen({ ...examen, escalaCalificacion: e.target.value })}
              >
                <option value="ESCALA_0_100">0 - 100</option>
                <option value="ESCALA_0_10">0 - 10</option>
                <option value="APROBADO_NOAPROBADO">Aprobado / No aprobado</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Nota aprobatoria</span>
              <input
                type="number"
                className={campo}
                value={examen.notaAprobatoria ?? ""}
                onChange={(e) =>
                  setExamen({ ...examen, notaAprobatoria: e.target.value ? Number(e.target.value) : null })
                }
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={examen.emiteCertificado}
              onChange={(e) => setExamen({ ...examen, emiteCertificado: e.target.checked })}
            />
            Emitir certificado a los aprobados
          </label>

          <hr className="border-cielo/10" />
          <p className="text-sm font-extrabold text-tinta">Seguridad: cierre automático por salidas de pantalla</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold"># de salidas permitidas (vacío = sin límite)</span>
              <input
                type="number"
                min={1}
                className={campo}
                value={examen.limiteSalidasPantalla ?? ""}
                onChange={(e) =>
                  setExamen({ ...examen, limiteSalidasPantalla: e.target.value ? Number(e.target.value) : null })
                }
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Mensaje al cerrar por exceder el límite</span>
            <textarea
              className={campo}
              placeholder="El examen se cerró automáticamente por salir varias veces de la pantalla."
              value={examen.mensajeCierrePorSalidas ?? ""}
              onChange={(e) => setExamen({ ...examen, mensajeCierrePorSalidas: e.target.value })}
            />
          </label>

          <hr className="border-cielo/10" />
          <p className="text-sm font-extrabold text-tinta">Mensaje de encabezado y verificación de lectura</p>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Mensaje para padres (vacío = usar el mensaje por defecto)</span>
            <textarea
              className={campo}
              rows={5}
              value={examen.mensajeEncabezado ?? ""}
              onChange={(e) => setExamen({ ...examen, mensajeEncabezado: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">
              Casilla correcta a marcar (déjalo vacío para no mostrar casillas). Escribe en el mensaje cuál deben marcar.
            </span>
            <select
              className={campo}
              value={examen.checkboxCorrecta ?? ""}
              onChange={(e) =>
                setExamen({ ...examen, checkboxCorrecta: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">Sin casillas</option>
              <option value="1">Casilla 1</option>
              <option value="2">Casilla 2</option>
              <option value="3">Casilla 3</option>
            </select>
          </label>
          <button
            disabled={guardandoConfig}
            className="mt-2 self-start rounded-full bg-cielo px-6 py-2.5 font-display font-extrabold text-white hover:bg-cielo-oscuro disabled:opacity-50"
          >
            {guardandoConfig ? "Guardando..." : "Guardar configuración"}
          </button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-tinta">
            Preguntas asignadas ({asignadas.length})
          </h2>
          <div className="flex flex-col gap-2">
            {asignadas.map((a) => (
              <div key={a.preguntaId} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                <span className="text-sm">{a.pregunta.enunciado}</span>
                <button
                  onClick={() => quitar(a.preguntaId)}
                  className="shrink-0 rounded-full bg-girasol/10 px-3 py-1 text-xs font-bold text-girasol"
                >
                  Quitar
                </button>
              </div>
            ))}
            {asignadas.length === 0 && (
              <p className="text-sm text-tinta-suave">Aún no hay preguntas asignadas.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-tinta">Banco de preguntas</h2>
          <input
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="mb-3 w-full rounded-xl border-2 border-cielo/15 bg-white px-3 py-2 outline-none focus:border-cielo"
          />
          <div className="flex flex-col gap-2">
            {banco
              .filter((p) => !idsAsignadas.has(p.id))
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                  <span className="text-sm">{p.enunciado}</span>
                  <button
                    onClick={() => asignar(p.id)}
                    className="shrink-0 rounded-full bg-hoja/15 px-3 py-1 text-xs font-bold text-hoja"
                  >
                    Agregar
                  </button>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
