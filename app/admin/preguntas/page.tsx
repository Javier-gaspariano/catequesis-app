"use client";

import { useEffect, useState } from "react";
import SubirImagen from "@/components/admin/SubirImagen";

const TIPOS = [
  "RESPUESTA_UNICA",
  "SELECCION_MULTIPLE",
  "VERDADERO_FALSO",
  "RELACIONAR_COLUMNAS",
  "ORDENAR_ELEMENTOS",
  "COMPLETAR_ESPACIOS",
  "IMAGEN_RESPUESTA",
  "BASADA_FOTOGRAFIA",
  "BASADA_AUDIO",
  "BASADA_VIDEO",
];

interface OpcionForm {
  texto: string;
  imagenUrl?: string;
  esCorrecta: boolean;
}

interface PreguntaResumen {
  id: string;
  enunciado: string;
  tipo: string;
  tema?: string | null;
  dificultad?: string | null;
  tiempoRespuestaSegundos?: number | null;
}

const campo = "w-full rounded-xl border-2 border-cielo/15 bg-white px-3 py-2 outline-none focus:border-cielo";

export default function BancoPreguntas() {
  const [lista, setLista] = useState<PreguntaResumen[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enunciado, setEnunciado] = useState("");
  const [tipo, setTipo] = useState("RESPUESTA_UNICA");
  const [imagenUrl, setImagenUrl] = useState("");
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("");
  const [dificultad, setDificultad] = useState("");
  const [retroalimentacion, setRetroalimentacion] = useState("");
  const [tiempoRespuesta, setTiempoRespuesta] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [opciones, setOpciones] = useState<OpcionForm[]>([
    { texto: "", esCorrecta: true },
    { texto: "", esCorrecta: false },
  ]);
  const [pares, setPares] = useState<{ a: string; b: string }[]>([
    { a: "", b: "" },
    { a: "", b: "" },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroTema, setFiltroTema] = useState("");
  const [filtroDificultad, setFiltroDificultad] = useState("");

  async function cargar() {
    const res = await fetch("/api/preguntas");
    setLista(await res.json());
  }
  useEffect(() => {
    cargar();
  }, []);

  function actualizarOpcion(i: number, campo: Partial<OpcionForm>) {
    setOpciones((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...campo } : o)));
  }

  function limpiarForm() {
    setEditandoId(null);
    setEnunciado("");
    setImagenUrl("");
    setTema("");
    setNivel("");
    setDificultad("");
    setRetroalimentacion("");
    setTiempoRespuesta("");
    setAudioUrl("");
    setVideoUrl("");
    setOpciones([
      { texto: "", esCorrecta: true },
      { texto: "", esCorrecta: false },
    ]);
    setPares([
      { a: "", b: "" },
      { a: "", b: "" },
    ]);
  }

  async function editar(id: string) {
    const res = await fetch("/api/preguntas");
    const todas = await res.json();
    const p = todas.find((x: { id: string }) => x.id === id);
    if (!p) return;
    setEditandoId(id);
    setEnunciado(p.enunciado);
    setTipo(p.tipo);
    setImagenUrl(p.imagenUrl ?? "");
    setTema(p.tema ?? "");
    setNivel(p.nivel ?? "");
    setDificultad(p.dificultad ?? "");
    setRetroalimentacion(p.retroalimentacion ?? "");
    setTiempoRespuesta(p.tiempoRespuestaSegundos ? String(p.tiempoRespuestaSegundos) : "");
    setAudioUrl(p.audioUrl ?? "");
    setVideoUrl(p.videoUrl ?? "");
    if (p.tipo === "RELACIONAR_COLUMNAS") {
      const opsA = p.opciones.filter((o: { grupo?: string }) => o.grupo === "A").sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
      const opsB = p.opciones.filter((o: { grupo?: string }) => o.grupo === "B").sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
      setPares(opsA.map((a: { texto: string }, i: number) => ({ a: a.texto ?? "", b: opsB[i]?.texto ?? "" })));
    }
    setOpciones(
      p.opciones.map((o: { texto: string; imagenUrl?: string; esCorrecta: boolean }) => ({
        texto: o.texto ?? "",
        imagenUrl: o.imagenUrl,
        esCorrecta: o.esCorrecta,
      }))
    );
    setMostrarForm(true);
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta pregunta del banco?")) return;
    const res = await fetch(`/api/preguntas/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar. Puede que esté asignada a un examen.");
      return;
    }
    cargar();
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const url = editandoId ? `/api/preguntas/${editandoId}` : "/api/preguntas";

    const opcionesFinal =
      tipo === "RELACIONAR_COLUMNAS"
        ? [
            ...pares.map((p, i) => ({ texto: p.a, esCorrecta: false, grupo: "A", orden: i })),
            ...pares.map((p, i) => ({ texto: p.b, esCorrecta: false, grupo: "B", orden: i })),
          ]
        : opciones;

    const res = await fetch(url, {
      method: editandoId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enunciado,
        tipo,
        imagenUrl: imagenUrl || undefined,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
        tema: tema || undefined,
        nivel: nivel || undefined,
        dificultad: dificultad || undefined,
        retroalimentacion: retroalimentacion || undefined,
        tiempoRespuestaSegundos: tiempoRespuesta ? Number(tiempoRespuesta) : null,
        opciones: opcionesFinal,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      setMostrarForm(false);
      limpiarForm();
      cargar();
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-tinta">Banco de preguntas</h1>
        <button
          onClick={() => {
            if (mostrarForm) limpiarForm();
            setMostrarForm((v) => !v);
          }}
          className="rounded-full bg-cielo px-5 py-2.5 font-display font-bold text-white hover:bg-cielo-oscuro"
        >
          {mostrarForm ? "Cancelar" : "+ Nueva pregunta"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={guardar} className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-bold text-cielo">
            {editandoId ? "Editando pregunta" : "Nueva pregunta"}
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Enunciado *</span>
            <textarea className={campo} required value={enunciado} onChange={(e) => setEnunciado(e.target.value)} />
          </label>

          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Tipo</span>
              <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Tema</span>
              <input className={campo} value={tema} onChange={(e) => setTema(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Nivel</span>
              <input className={campo} value={nivel} onChange={(e) => setNivel(e.target.value)} />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Dificultad</span>
            <select className={campo} value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
              <option value="">Sin especificar</option>
              <option value="facil">Fácil</option>
              <option value="medio">Medio</option>
              <option value="dificil">Difícil</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Tiempo de respuesta (segundos, vacío = tiempo libre)</span>
            <input
              type="number"
              min={1}
              className={campo}
              placeholder="Ej. 30"
              value={tiempoRespuesta}
              onChange={(e) => setTiempoRespuesta(e.target.value)}
            />
          </label>

          <SubirImagen etiqueta="Imagen de la pregunta (opcional)" valor={imagenUrl} onCambiar={setImagenUrl} />

          {tipo === "BASADA_AUDIO" && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">URL del audio *</span>
              <input
                className={campo}
                required
                placeholder="https://..."
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </label>
          )}

          {tipo === "BASADA_VIDEO" && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">URL del video *</span>
              <input
                className={campo}
                required
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </label>
          )}

          {tipo === "RELACIONAR_COLUMNAS" ? (
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold">Parejas correctas (columna A ↔ columna B)</span>
              {pares.map((p, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border-2 border-cielo/10 p-2">
                  <input
                    className="flex-1 rounded-lg border border-cielo/15 px-2 py-1 outline-none focus:border-cielo"
                    placeholder={`A${i + 1}`}
                    value={p.a}
                    onChange={(e) =>
                      setPares((prev) => prev.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)))
                    }
                  />
                  <span className="text-tinta-suave">↔</span>
                  <input
                    className="flex-1 rounded-lg border border-cielo/15 px-2 py-1 outline-none focus:border-cielo"
                    placeholder={`B${i + 1}`}
                    value={p.b}
                    onChange={(e) =>
                      setPares((prev) => prev.map((x, idx) => (idx === i ? { ...x, b: e.target.value } : x)))
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPares((p) => [...p, { a: "", b: "" }])}
                className="self-start text-sm font-bold text-cielo"
              >
                + Agregar pareja
              </button>
            </div>
          ) : tipo === "ORDENAR_ELEMENTOS" ? (
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold">Elementos en el orden CORRECTO (de arriba a abajo)</span>
              {opciones.map((o, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border-2 border-cielo/10 p-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() =>
                        setOpciones((prev) => {
                          const copia = [...prev];
                          [copia[i - 1], copia[i]] = [copia[i], copia[i - 1]];
                          return copia;
                        })
                      }
                      className="text-xs text-cielo disabled:opacity-20"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={i === opciones.length - 1}
                      onClick={() =>
                        setOpciones((prev) => {
                          const copia = [...prev];
                          [copia[i], copia[i + 1]] = [copia[i + 1], copia[i]];
                          return copia;
                        })
                      }
                      className="text-xs text-cielo disabled:opacity-20"
                    >
                      ▼
                    </button>
                  </div>
                  <span className="w-5 text-center text-sm font-bold text-tinta-suave">{i + 1}</span>
                  <input
                    className="flex-1 rounded-lg border border-cielo/15 px-2 py-1 outline-none focus:border-cielo"
                    placeholder={`Elemento ${i + 1}`}
                    value={o.texto}
                    onChange={(e) => actualizarOpcion(i, { texto: e.target.value })}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOpciones((p) => [...p, { texto: "", esCorrecta: false }])}
                className="self-start text-sm font-bold text-cielo"
              >
                + Agregar elemento
              </button>
            </div>
          ) : tipo === "COMPLETAR_ESPACIOS" ? (
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold">Respuestas válidas (se acepta cualquiera de estas)</span>
              {opciones.map((o, i) => (
                <input
                  key={i}
                  className={campo}
                  placeholder={`Respuesta válida ${i + 1}`}
                  value={o.texto}
                  onChange={(e) => actualizarOpcion(i, { texto: e.target.value })}
                />
              ))}
              <button
                type="button"
                onClick={() => setOpciones((p) => [...p, { texto: "", esCorrecta: true }])}
                className="self-start text-sm font-bold text-cielo"
              >
                + Agregar respuesta válida
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold">Opciones (marca la correcta)</span>
              {opciones.map((o, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border-2 border-cielo/10 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={o.esCorrecta}
                      onChange={(e) => actualizarOpcion(i, { esCorrecta: e.target.checked })}
                      title="Marcar como correcta"
                    />
                    <input
                      className="flex-1 rounded-lg border border-cielo/15 px-2 py-1 outline-none focus:border-cielo"
                      placeholder={`Opción ${i + 1}`}
                      value={o.texto}
                      onChange={(e) => actualizarOpcion(i, { texto: e.target.value })}
                    />
                  </div>
                  {tipo === "IMAGEN_RESPUESTA" && (
                    <SubirImagen
                      etiqueta={`Imagen opción ${i + 1}`}
                      valor={o.imagenUrl}
                      onCambiar={(url) => actualizarOpcion(i, { imagenUrl: url })}
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOpciones((p) => [...p, { texto: "", esCorrecta: false }])}
                className="self-start text-sm font-bold text-cielo"
              >
                + Agregar opción
              </button>
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Retroalimentación (opcional)</span>
            <textarea
              className={campo}
              value={retroalimentacion}
              onChange={(e) => setRetroalimentacion(e.target.value)}
            />
          </label>

          <button
            disabled={guardando}
            className="mt-2 self-start rounded-full bg-hoja px-6 py-2.5 font-display font-extrabold text-white disabled:opacity-50"
          >
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar pregunta"}
          </button>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <input
          placeholder="Buscar por texto..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          className="min-w-[180px] flex-1 rounded-lg border border-cielo/15 px-3 py-1.5 text-sm outline-none focus:border-cielo"
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-lg border border-cielo/15 px-3 py-1.5 text-sm outline-none focus:border-cielo"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={filtroTema}
          onChange={(e) => setFiltroTema(e.target.value)}
          className="rounded-lg border border-cielo/15 px-3 py-1.5 text-sm outline-none focus:border-cielo"
        >
          <option value="">Todos los temas</option>
          {[...new Set(lista.map((p) => p.tema).filter(Boolean))].map((t) => (
            <option key={t as string} value={t as string}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filtroDificultad}
          onChange={(e) => setFiltroDificultad(e.target.value)}
          className="rounded-lg border border-cielo/15 px-3 py-1.5 text-sm outline-none focus:border-cielo"
        >
          <option value="">Toda dificultad</option>
          <option value="facil">Fácil</option>
          <option value="medio">Medio</option>
          <option value="dificil">Difícil</option>
        </select>
        {(filtroTexto || filtroTipo || filtroTema || filtroDificultad) && (
          <button
            onClick={() => {
              setFiltroTexto("");
              setFiltroTipo("");
              setFiltroTema("");
              setFiltroDificultad("");
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-girasol"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {(() => {
        const filtradas = lista.filter(
          (p) =>
            (!filtroTexto || p.enunciado.toLowerCase().includes(filtroTexto.toLowerCase())) &&
            (!filtroTipo || p.tipo === filtroTipo) &&
            (!filtroTema || p.tema === filtroTema) &&
            (!filtroDificultad || p.dificultad === filtroDificultad)
        );
        const grupos = new Map<string, PreguntaResumen[]>();
        for (const p of filtradas) {
          const clave = p.tema?.trim() || "Sin tema";
          grupos.set(clave, [...(grupos.get(clave) ?? []), p]);
        }
        let contadorGlobal = 0;
        return (
          <div className="flex flex-col gap-6">
            {[...grupos.entries()].map(([tema, preguntas]) => (
              <div key={tema}>
                <h3 className="mb-2 font-display text-sm font-extrabold uppercase tracking-wide text-cielo">
                  {tema} <span className="text-tinta-suave">({preguntas.length})</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {preguntas.map((p) => {
                    contadorGlobal += 1;
                    return (
                      <div key={p.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                        <div className="flex gap-3">
                          <span className="shrink-0 text-sm font-bold text-tinta-suave">{contadorGlobal}.</span>
                          <div>
                            <p className="text-sm font-semibold text-tinta">{p.enunciado}</p>
                            <p className="text-xs text-tinta-suave">
                              {p.tipo.replaceAll("_", " ")} {p.dificultad && `· ${p.dificultad}`}
                              {p.tiempoRespuestaSegundos && ` · ⏳ ${p.tiempoRespuestaSegundos}s`}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => editar(p.id)}
                            className="rounded-full bg-cielo/10 px-3 py-1 text-xs font-bold text-cielo"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminar(p.id)}
                            className="rounded-full bg-girasol/10 px-3 py-1 text-xs font-bold text-girasol"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filtradas.length === 0 && <p className="text-sm text-tinta-suave">No hay preguntas con esos filtros.</p>}
          </div>
        );
      })()}
    </div>
  );
}
