"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SACRAMENTOS = ["Catecúmeno", "Confirmación", "Comunión"];

export default function FiltrosDashboard({ examenes }: { examenes: { id: string; titulo: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function actualizar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(params.toString());
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    router.push(`/admin?${nuevos.toString()}`);
  }

  const campo = "rounded-full border-2 border-cielo/15 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-cielo";

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <select
        value={params.get("examenId") ?? ""}
        onChange={(e) => actualizar("examenId", e.target.value)}
        className={campo}
      >
        <option value="">Todos los exámenes</option>
        {examenes.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.titulo}
          </option>
        ))}
      </select>
      <select
        value={params.get("sacramento") ?? ""}
        onChange={(e) => actualizar("sacramento", e.target.value)}
        className={campo}
      >
        <option value="">Todos los sacramentos</option>
        {SACRAMENTOS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {(params.get("examenId") || params.get("sacramento")) && (
        <button onClick={() => router.push("/admin")} className="text-sm font-bold text-girasol">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
