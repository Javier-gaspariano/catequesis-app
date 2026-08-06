"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ExamenResumen {
  id: string;
  titulo: string;
  estado: string;
  createdAt: string;
  _count: { preguntas: number; intentos: number };
}

export default function ListaExamenes() {
  const [examenes, setExamenes] = useState<ExamenResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/examenes?admin=1");
    setExamenes(await res.json());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarEstado(id: string, estado: string) {
    await fetch(`/api/examenes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este examen? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/examenes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar.");
      return;
    }
    cargar();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-tinta">Exámenes</h1>
        <Link
          href="/admin/examenes/nuevo"
          className="rounded-full bg-cielo px-5 py-2.5 font-display font-bold text-white shadow-sm hover:bg-cielo-oscuro"
        >
          + Nuevo examen
        </Link>
      </div>

      {cargando && <p className="text-tinta-suave">Cargando...</p>}
      {!cargando && examenes.length === 0 && (
        <p className="text-tinta-suave">Todavía no hay exámenes. Crea el primero.</p>
      )}

      <div className="flex flex-col gap-3">
        {examenes.map((ex) => (
          <div
            key={ex.id}
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display font-bold text-tinta">{ex.titulo}</p>
              <p className="text-sm text-tinta-suave">
                {ex._count.preguntas} preguntas · {ex._count.intentos} intentos ·{" "}
                <EstadoBadge estado={ex.estado} />
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/examenes/${ex.id}`}
                className="rounded-full bg-cielo/10 px-4 py-1.5 text-sm font-bold text-cielo"
              >
                Editar
              </Link>
              <button
                onClick={async () => {
                  await fetch(`/api/examenes/${ex.id}/duplicar`, { method: "POST" });
                  cargar();
                }}
                className="rounded-full bg-tinta-suave/10 px-4 py-1.5 text-sm font-bold text-tinta-suave"
              >
                Duplicar
              </button>
              {ex.estado === "PUBLICADO" ? (
                <button
                  onClick={() => cambiarEstado(ex.id, "DESPUBLICADO")}
                  className="rounded-full bg-sol/20 px-4 py-1.5 text-sm font-bold text-tinta"
                >
                  Despublicar
                </button>
              ) : (
                <button
                  onClick={() => cambiarEstado(ex.id, "PUBLICADO")}
                  className="rounded-full bg-hoja/15 px-4 py-1.5 text-sm font-bold text-hoja"
                >
                  Publicar
                </button>
              )}
              <button
                onClick={() => eliminar(ex.id)}
                className="rounded-full bg-girasol/10 px-4 py-1.5 text-sm font-bold text-girasol"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    PUBLICADO: "text-hoja",
    BORRADOR: "text-tinta-suave",
    DESPUBLICADO: "text-girasol",
    ARCHIVADO: "text-tinta-suave",
  };
  return <span className={`font-bold ${estilos[estado] ?? ""}`}>{estado}</span>;
}
