"use client";

import { useEffect, useState } from "react";

interface Grupo {
  examen: string;
  aciertos: number;
  alumnos: { id: string; nombreCompleto: string }[];
  patronIdentico: boolean;
}

export default function Coincidencias() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/estadisticas/coincidencias")
      .then((r) => r.json())
      .then((d) => {
        setGrupos(d);
        setCargando(false);
      });
  }, []);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-extrabold text-tinta">Posibles coincidencias</h1>
      <p className="mb-6 max-w-2xl text-sm text-tinta-suave">
        Alumnos del mismo examen que obtuvieron exactamente el mismo número de aciertos. Los marcados en
        rojo respondieron <strong>exactamente igual en todas las preguntas</strong> — es el indicio más
        fuerte de una posible copia (aunque coincidencias por azar también son posibles, sobre todo con
        pocas preguntas).
      </p>

      {cargando && <p className="text-tinta-suave">Cargando...</p>}

      <div className="flex flex-col gap-3">
        {grupos.map((g, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 shadow-sm ${
              g.patronIdentico ? "border-2 border-girasol bg-girasol/10" : "bg-white"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display font-bold text-tinta">{g.examen}</p>
              <span className="text-xs font-bold text-tinta-suave">{g.aciertos} aciertos cada uno</span>
            </div>
            {g.patronIdentico && (
              <p className="mb-2 text-xs font-bold text-girasol">
                ⚠ Respuestas idénticas en todas las preguntas
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {g.alumnos.map((a) => (
                <span key={a.id} className="rounded-full bg-cielo/10 px-3 py-1 text-xs font-semibold text-cielo">
                  {a.nombreCompleto}
                </span>
              ))}
            </div>
          </div>
        ))}
        {!cargando && grupos.length === 0 && (
          <p className="text-sm text-tinta-suave">No se encontraron coincidencias.</p>
        )}
      </div>
    </div>
  );
}
