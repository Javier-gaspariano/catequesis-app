"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

interface General {
  participantes: number;
  promedioCalificacion: number;
  promedioPorcentaje: number;
  aprobados: number;
  reprobados: number;
  tiempoPromedioSegundos: number;
}
interface Segmento {
  nombre: string;
  promedio: number;
  participantes: number;
  aprobados: number;
}
interface PreguntaAnalisis {
  id: string;
  enunciado: string;
  porcentajeAciertos: number;
  dificultad: string;
  discriminacion: number;
}
interface TiempoSalidas {
  examen: string;
  participantes: number;
  tiempoPromedioMinutos: number;
  salidasPromedio: number;
  conSalida: number;
}
interface LecturaMensaje {
  examen: string;
  total: number;
  correctos: number;
  porcentaje: number;
}
interface ExamenResumen {
  id: string;
  titulo: string;
}
interface CatequistaResumen {
  id: string;
  nombre: string;
}

const COLORES = ["#2E86FF", "#22C55E", "#FFC93C", "#FF7A45", "#1B5FCC"];
const DIMENSIONES = [
  { valor: "capilla", label: "Capilla" },
  { valor: "catequista", label: "Catequista" },
  { valor: "edad", label: "Edad" },
  { valor: "sexo", label: "Sexo" },
  { valor: "grupo", label: "Grupo" },
  { valor: "examen", label: "Examen" },
];

export default function Estadisticas() {
  const [general, setGeneral] = useState<General | null>(null);
  const [dimension, setDimension] = useState("capilla");
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [tiempoSalidas, setTiempoSalidas] = useState<TiempoSalidas[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaAnalisis[]>([]);
  const [masFallada, setMasFallada] = useState<PreguntaAnalisis | null>(null);
  const [masAcertada, setMasAcertada] = useState<PreguntaAnalisis | null>(null);
  const [examenes, setExamenes] = useState<ExamenResumen[]>([]);
  const [catequistas, setCatequistas] = useState<CatequistaResumen[]>([]);
  const [lecturaMensaje, setLecturaMensaje] = useState<LecturaMensaje[]>([]);

  // filtros de "Análisis de preguntas"
  const [filtroExamen, setFiltroExamen] = useState("");
  const [filtroCatequista, setFiltroCatequista] = useState("");
  const [filtroDificultad, setFiltroDificultad] = useState("");
  const [filtroPorcentajeMin, setFiltroPorcentajeMin] = useState("");
  const [filtroPorcentajeMax, setFiltroPorcentajeMax] = useState("");
  const [orden, setOrden] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetch("/api/estadisticas/general").then((r) => r.json()).then(setGeneral);
    fetch("/api/estadisticas/tiempo-salidas").then((r) => r.json()).then(setTiempoSalidas);
    fetch("/api/estadisticas/lectura-mensaje").then((r) => r.json()).then(setLecturaMensaje);
    fetch("/api/examenes?admin=1")
      .then((r) => r.json())
      .then((d) => setExamenes(Array.isArray(d) ? d : []));
    fetch("/api/catequistas")
      .then((r) => r.json())
      .then((d) => setCatequistas(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    fetch(`/api/estadisticas/segmentacion?por=${dimension}`).then((r) => r.json()).then(setSegmentos);
  }, [dimension]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroExamen) params.set("examenId", filtroExamen);
    if (filtroCatequista) params.set("catequistaId", filtroCatequista);
    const qs = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/estadisticas/preguntas${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setPreguntas(d.preguntas ?? []);
        setMasFallada(d.masFallada ?? null);
        setMasAcertada(d.masAcertada ?? null);
      });
  }, [filtroExamen, filtroCatequista]);

  const preguntasFiltradas = useMemo(() => {
    return preguntas
      .filter((p) => !filtroDificultad || p.dificultad === filtroDificultad)
      .filter((p) => !filtroPorcentajeMin || p.porcentajeAciertos >= Number(filtroPorcentajeMin))
      .filter((p) => !filtroPorcentajeMax || p.porcentajeAciertos <= Number(filtroPorcentajeMax))
      .sort((a, b) => (orden === "desc" ? b.porcentajeAciertos - a.porcentajeAciertos : a.porcentajeAciertos - b.porcentajeAciertos));
  }, [preguntas, filtroDificultad, filtroPorcentajeMin, filtroPorcentajeMax, orden]);

  function exportarAnalisisExcel() {
    const filas = preguntasFiltradas.map((p) => ({
      Pregunta: p.enunciado,
      "% Aciertos": p.porcentajeAciertos,
      "% Errores": 100 - p.porcentajeAciertos,
      Dificultad: p.dificultad,
      Discriminacion: p.discriminacion,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas);
    XLSX.utils.book_append_sheet(wb, ws, "Analisis preguntas");
    XLSX.writeFile(wb, "analisis-preguntas.xlsx");
  }

  const campo = "rounded-full border-2 border-cielo/15 px-3 py-1.5 text-sm font-semibold outline-none focus:border-cielo";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-extrabold text-tinta">Estadísticas</h1>

      <div className="flex flex-wrap gap-2">
        {["excel", "csv", "pdf"].map((f) => (
          <a
            key={f}
            href={`/api/reportes?formato=${f}`}
            className="rounded-full bg-cielo/10 px-4 py-2 text-sm font-bold text-cielo hover:bg-cielo/20"
          >
            ⬇ Exportar {f.toUpperCase()}
          </a>
        ))}
        <a
          href="/api/reportes/detalle?formato=excel"
          className="rounded-full bg-hoja/10 px-4 py-2 text-sm font-bold text-hoja hover:bg-hoja/20"
        >
          ⬇ Reporte detallado (por pregunta)
        </a>
      </div>

      {general && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Tarjeta label="Participantes" valor={general.participantes} />
          <Tarjeta label="Promedio" valor={general.promedioCalificacion.toFixed(1)} />
          <Tarjeta label="Aprobados" valor={general.aprobados} color="text-hoja" />
          <Tarjeta label="Reprobados" valor={general.reprobados} color="text-girasol" />
          <Tarjeta
            label="Tiempo promedio"
            valor={`${Math.floor(general.tiempoPromedioSegundos / 60)} min`}
          />
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-tinta">Promedio segmentado</h2>
          <select value={dimension} onChange={(e) => setDimension(e.target.value)} className={campo}>
            {DIMENSIONES.map((d) => (
              <option key={d.valor} value={d.valor}>
                Por {d.label}
              </option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={segmentos}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="promedio" fill="#2E86FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {general && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-bold text-tinta">Aprobados vs. Reprobados</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { nombre: "Aprobados", valor: general.aprobados },
                  { nombre: "Reprobados", valor: general.reprobados },
                ]}
                dataKey="valor"
                nameKey="nombre"
                outerRadius={90}
                label
              >
                {COLORES.slice(0, 2).map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-display text-lg font-bold text-tinta">Tiempo y salidas de pantalla por examen</h2>
        <p className="mb-4 text-xs text-tinta-suave">
          Cuántas veces en promedio los alumnos salieron de la pantalla del examen (posible copia) y cuánto tiempo tardaron, agrupado por examen.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tiempoSalidas}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="examen" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="izq" orientation="left" />
            <YAxis yAxisId="der" orientation="right" />
            <Tooltip />
            <Bar yAxisId="izq" dataKey="tiempoPromedioMinutos" name="Minutos promedio" fill="#2E86FF" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="der" dataKey="salidasPromedio" name="Salidas promedio" fill="#FF7A45" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-col gap-1">
          {tiempoSalidas.map((t) => (
            <p key={t.examen} className="text-xs text-tinta-suave">
              <strong className="text-tinta">{t.examen}:</strong> {t.participantes} participantes ·{" "}
              {t.conSalida} con al menos una salida de pantalla
            </p>
          ))}
        </div>
      </section>

      {lecturaMensaje.length > 0 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-bold text-tinta">Verificación de lectura del mensaje</h2>
          <p className="mb-4 text-xs text-tinta-suave">
            % de padres que marcaron correctamente la casilla indicada en el mensaje del encabezado (solo exámenes con esa verificación configurada).
          </p>
          <div className="flex flex-col gap-2">
            {lecturaMensaje.map((l) => (
              <div key={l.examen} className="flex items-center justify-between rounded-xl border border-cielo/10 p-3">
                <span className="text-sm font-semibold text-tinta">{l.examen}</span>
                <span className="text-xs font-bold text-cielo">
                  {l.correctos}/{l.total} correctos ({l.porcentaje}%)
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-tinta">Análisis de preguntas</h2>
          <button
            onClick={exportarAnalisisExcel}
            className="rounded-full bg-hoja/10 px-4 py-2 text-sm font-bold text-hoja hover:bg-hoja/20"
          >
            ⬇ Exportar a Excel
          </button>
        </div>

        {(masFallada || masAcertada) && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {masFallada && (
              <div className="rounded-xl bg-girasol/10 p-3">
                <p className="text-xs font-bold uppercase text-girasol">Pregunta con menor % de aciertos</p>
                <p className="text-sm text-tinta">{masFallada.enunciado}</p>
                <p className="text-xs font-bold text-girasol">{masFallada.porcentajeAciertos}%</p>
              </div>
            )}
            {masAcertada && (
              <div className="rounded-xl bg-hoja/10 p-3">
                <p className="text-xs font-bold uppercase text-hoja">Pregunta con mayor % de aciertos</p>
                <p className="text-sm text-tinta">{masAcertada.enunciado}</p>
                <p className="text-xs font-bold text-hoja">{masAcertada.porcentajeAciertos}%</p>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <select value={filtroExamen} onChange={(e) => setFiltroExamen(e.target.value)} className={campo}>
            <option value="">Todos los exámenes</option>
            {examenes.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.titulo}
              </option>
            ))}
          </select>
          <select value={filtroCatequista} onChange={(e) => setFiltroCatequista(e.target.value)} className={campo}>
            <option value="">Todos los catequistas</option>
            {catequistas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select value={filtroDificultad} onChange={(e) => setFiltroDificultad(e.target.value)} className={campo}>
            <option value="">Toda dificultad</option>
            <option value="fácil">Fácil</option>
            <option value="media">Media</option>
            <option value="difícil">Difícil</option>
          </select>
          <input
            type="number"
            placeholder="% mín."
            value={filtroPorcentajeMin}
            onChange={(e) => setFiltroPorcentajeMin(e.target.value)}
            className={`${campo} w-24`}
          />
          <input
            type="number"
            placeholder="% máx."
            value={filtroPorcentajeMax}
            onChange={(e) => setFiltroPorcentajeMax(e.target.value)}
            className={`${campo} w-24`}
          />
          <select value={orden} onChange={(e) => setOrden(e.target.value as "desc" | "asc")} className={campo}>
            <option value="desc">Mayor % primero</option>
            <option value="asc">Menor % primero</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          {preguntasFiltradas.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-cielo/10 p-3">
              <span className="max-w-md truncate text-sm">{p.enunciado}</span>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="rounded-full bg-cielo/10 px-2 py-1 text-cielo">{p.porcentajeAciertos}% aciertos</span>
                <span className="rounded-full bg-sol/20 px-2 py-1 text-tinta">{p.dificultad}</span>
                <span className="rounded-full bg-hoja/10 px-2 py-1 text-hoja">disc. {p.discriminacion}</span>
              </div>
            </div>
          ))}
          {preguntasFiltradas.length === 0 && <p className="text-sm text-tinta-suave">No hay preguntas con esos filtros.</p>}
        </div>
      </section>
    </div>
  );
}

function Tarjeta({ label, valor, color = "text-tinta" }: { label: string; valor: string | number; color?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className={`font-display text-2xl font-extrabold ${color}`}>{valor}</p>
      <p className="text-xs font-semibold text-tinta-suave">{label}</p>
    </div>
  );
}
