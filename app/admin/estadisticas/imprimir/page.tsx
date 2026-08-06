"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BotonImprimir from "@/components/admin/BotonImprimir";

interface PreguntaAnalisis {
  id: string;
  enunciado: string;
  porcentajeAciertos: number;
  porcentajeSalidas: number;
}

interface AlumnoSalida {
  nombreCompleto: string;
  cambiosFoco: number;
  calificacion: number | null;
}

interface Alumno {
  nombreCompleto: string;
  calificacion: number | null;
  aprobado: boolean | null;
}

interface Reporte {
  capilla: string | null;
  catequista: string | null;
  examen: string | null;
  numAlumnos: number;
  promedioGeneral: number;
  porcentajeSalidasGeneral: number;
  preguntas: PreguntaAnalisis[];
  masFallada: PreguntaAnalisis | null;
  masAcertada: PreguntaAnalisis | null;
  alumnosConSalida: AlumnoSalida[];
  alumnos: Alumno[];
}

function ReporteImprimible() {
  const params = useSearchParams();
  const [reporte, setReporte] = useState<Reporte | null>(null);

  useEffect(() => {
    fetch(`/api/estadisticas/reporte-preguntas?${params.toString()}`)
      .then((r) => r.json())
      .then(setReporte);
  }, [params]);

  if (!reporte) return <p className="p-8 text-tinta-suave">Cargando...</p>;

  return (
    <div className="mx-auto max-w-[8.5in] bg-white p-8 text-tinta print:p-[0.6in]">
      <BotonImprimir />

      <div className="mb-4 border-b-2 border-cielo/20 pb-3">
        <p className="font-display text-lg font-extrabold text-cielo">Reporte de análisis de preguntas</p>
        <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] text-tinta">
          {reporte.examen && (
            <p>
              <strong>Examen:</strong> {reporte.examen}
            </p>
          )}
          <p>
            <strong>Capilla:</strong> {reporte.capilla ?? "Todas"}
          </p>
          <p>
            <strong>Catequista:</strong> {reporte.catequista ?? "Todos"}
          </p>
          <p>
            <strong>Número de alumnos:</strong> {reporte.numAlumnos}
          </p>
          <p>
            <strong>Promedio general:</strong> {reporte.promedioGeneral}
          </p>
          <p>
            <strong>% que salió de la pantalla:</strong> {reporte.porcentajeSalidasGeneral}%
          </p>
        </div>
      </div>

      {reporte.alumnos.length > 0 && (
        <div className="mb-4 border-b-2 border-cielo/20 pb-3 text-[11px]">
          <p className="mb-1 font-bold">Alumnos del grupo (ordenados por calificación):</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-cielo/20 text-left">
                <th className="py-1 pr-2">#</th>
                <th className="py-1 pr-2">Alumno</th>
                <th className="py-1 pr-2">Calificación</th>
                <th className="py-1">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {reporte.alumnos.map((a, i) => (
                <tr key={i} className="border-b border-cielo/10">
                  <td className="py-1 pr-2">{i + 1}</td>
                  <td className="py-1 pr-2">{a.nombreCompleto}</td>
                  <td className="py-1 pr-2">{a.calificacion ?? "—"}</td>
                  <td className={`py-1 font-semibold ${a.aprobado ? "text-hoja" : "text-girasol"}`}>
                    {a.aprobado === null ? "—" : a.aprobado ? "Aprobado" : "No aprobado"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {reporte.preguntas.map((p, i) => {
          const debil = p.porcentajeAciertos < 70;
          return (
            <div
              key={p.id}
              className={`break-inside-avoid rounded-lg p-2 text-[11px] leading-snug ${
                debil ? "border-2 border-girasol bg-girasol/10" : "border border-transparent"
              }`}
            >
              <p>
                <strong>
                  {i + 1}. {p.enunciado}
                </strong>
              </p>
              <p className={debil ? "font-bold text-girasol" : "text-tinta-suave"}>
                {p.porcentajeAciertos}% de aciertos · {p.porcentajeSalidas}% salió de la pantalla en esta pregunta
                {debil && " · ⚠ Reforzar este tema"}
              </p>
            </div>
          );
        })}
        {reporte.preguntas.length === 0 && <p className="text-tinta-suave">No hay preguntas con estos filtros.</p>}
      </div>

      <div className="mt-4 border-t-2 border-cielo/20 pt-2 text-[11px]">
        {reporte.masFallada && (
          <p>
            <strong>Pregunta con menor % de aciertos:</strong> {reporte.masFallada.enunciado} (
            {reporte.masFallada.porcentajeAciertos}%)
          </p>
        )}
        {reporte.masAcertada && (
          <p>
            <strong>Pregunta con mayor % de aciertos:</strong> {reporte.masAcertada.enunciado} (
            {reporte.masAcertada.porcentajeAciertos}%)
          </p>
        )}
      </div>

      {reporte.alumnosConSalida.length > 0 && (
        <div className="mt-4 border-t-2 border-cielo/20 pt-2 text-[11px]">
          <p className="mb-1 font-bold">Alumnos que salieron de la pantalla del examen:</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-cielo/20 text-left">
                <th className="py-1 pr-2">Alumno</th>
                <th className="py-1 pr-2">Veces que salió</th>
                <th className="py-1">Calificación</th>
              </tr>
            </thead>
            <tbody>
              {reporte.alumnosConSalida.map((a, i) => (
                <tr key={i} className="border-b border-cielo/10">
                  <td className="py-1 pr-2">{a.nombreCompleto}</td>
                  <td className="py-1 pr-2">{a.cambiosFoco}</td>
                  <td className="py-1">{a.calificacion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PaginaReporte() {
  return (
    <Suspense fallback={null}>
      <ReporteImprimible />
    </Suspense>
  );
}
