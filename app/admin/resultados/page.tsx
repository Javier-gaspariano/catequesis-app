"use client";

import { useEffect, useMemo, useState } from "react";

interface Intento {
  id: string;
  nombreCompleto: string;
  edad: number;
  grupo?: string | null;
  cambiosFoco: number;
  examen: { titulo: string };
  capilla?: { nombre: string } | null;
  catequista?: { nombre: string } | null;
  resultado?: { calificacion: number; aprobado: boolean } | null;
  finalizadoEn?: string | null;
}

export default function Resultados() {
  const [lista, setLista] = useState<Intento[]>([]);
  const [filtroCatequista, setFiltroCatequista] = useState("");
  const [filtroCapilla, setFiltroCapilla] = useState("");
  const [filtroSacramento, setFiltroSacramento] = useState("");
  const [filtroExamen, setFiltroExamen] = useState("");

  async function cargarConId() {
    const res = await fetch("/api/intentos?admin=1");
    if (res.ok) setLista(await res.json());
  }

  useEffect(() => {
    cargarConId();
  }, []);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este examen realizado? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/intentos/${id}`, { method: "DELETE" });
    if (res.ok) cargarConId();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar.");
    }
  }

  const catequistas = useMemo(
    () => [...new Set(lista.map((it) => it.catequista?.nombre).filter(Boolean))] as string[],
    [lista]
  );
  const capillas = useMemo(
    () => [...new Set(lista.map((it) => it.capilla?.nombre).filter(Boolean))] as string[],
    [lista]
  );
  const sacramentos = useMemo(
    () => [...new Set(lista.map((it) => it.grupo).filter(Boolean))] as string[],
    [lista]
  );
  const examenes = useMemo(
    () => [...new Set(lista.map((it) => it.examen?.titulo).filter(Boolean))] as string[],
    [lista]
  );

  const filtrados = lista.filter(
    (it) =>
      (!filtroCatequista || it.catequista?.nombre === filtroCatequista) &&
      (!filtroCapilla || it.capilla?.nombre === filtroCapilla) &&
      (!filtroSacramento || it.grupo === filtroSacramento) &&
      (!filtroExamen || it.examen?.titulo === filtroExamen)
  );

  function descargarCSV() {
    const encabezados = [
      "Nombre",
      "Examen",
      "Sacramento",
      "Capilla",
      "Catequista",
      "Calificación",
      "Aprobado",
      "Cambios de pantalla",
      "Fecha",
    ];
    const filas = filtrados.map((it) => [
      it.nombreCompleto,
      it.examen?.titulo ?? "",
      it.grupo ?? "",
      it.capilla?.nombre ?? "",
      it.catequista?.nombre ?? "",
      it.resultado?.calificacion ?? "",
      it.resultado?.aprobado ? "Sí" : "No",
      it.cambiosFoco ?? 0,
      it.finalizadoEn?.slice(0, 10) ?? "",
    ]);
    const csv = [encabezados, ...filas]
      .map((f) => f.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "examenes-realizados-filtrado.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const campo = "rounded-lg border border-cielo/15 px-3 py-1.5 text-sm outline-none focus:border-cielo";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-tinta">Exámenes realizados</h1>
        <button
          onClick={descargarCSV}
          className="rounded-full bg-hoja/10 px-4 py-2 text-sm font-bold text-hoja hover:bg-hoja/20"
        >
          ⬇ Descargar filtrado (CSV)
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <select value={filtroCatequista} onChange={(e) => setFiltroCatequista(e.target.value)} className={campo}>
          <option value="">Todos los catequistas</option>
          {catequistas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filtroCapilla} onChange={(e) => setFiltroCapilla(e.target.value)} className={campo}>
          <option value="">Todas las capillas</option>
          {capillas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filtroSacramento} onChange={(e) => setFiltroSacramento(e.target.value)} className={campo}>
          <option value="">Todos los sacramentos</option>
          {sacramentos.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={filtroExamen} onChange={(e) => setFiltroExamen(e.target.value)} className={campo}>
          <option value="">Todos los exámenes</option>
          {examenes.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
        {(filtroCatequista || filtroCapilla || filtroSacramento || filtroExamen) && (
          <button
            onClick={() => {
              setFiltroCatequista("");
              setFiltroCapilla("");
              setFiltroSacramento("");
              setFiltroExamen("");
            }}
            className="text-sm font-bold text-girasol"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {filtrados.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-tinta">{it.nombreCompleto}</p>
              <p className="text-xs text-tinta-suave">
                {it.examen?.titulo} {it.grupo && `· ${it.grupo}`} · {it.capilla?.nombre ?? "—"} ·{" "}
                {it.catequista?.nombre ?? "—"} ·{" "}
                {it.resultado ? `${it.resultado.calificacion} (${it.resultado.aprobado ? "Aprobado" : "No aprobado"})` : "Sin calificar"}
                {it.cambiosFoco > 0 && (
                  <span className="ml-2 font-bold text-girasol">⚠ {it.cambiosFoco} salida(s) de pantalla</span>
                )}
              </p>
            </div>
            <button
              onClick={() => eliminar(it.id)}
              className="rounded-full bg-girasol/10 px-3 py-1 text-xs font-bold text-girasol"
            >
              Eliminar
            </button>
          </div>
        ))}
        {filtrados.length === 0 && <p className="text-sm text-tinta-suave">No hay exámenes con esos filtros.</p>}
      </div>
    </div>
  );
}
