"use client";

import { useEffect, useState } from "react";

interface Capilla {
  id: string;
  nombre: string;
}

export default function Capillas() {
  const [lista, setLista] = useState<Capilla[]>([]);
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/capillas");
    setLista(await res.json());
  }
  useEffect(() => {
    cargar();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const url = editandoId ? `/api/capillas/${editandoId}` : "/api/capillas";
    await fetch(url, {
      method: editandoId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    setNombre("");
    setEditandoId(null);
    cargar();
  }

  function editar(c: Capilla) {
    setEditandoId(c.id);
    setNombre(c.nombre);
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta capilla?")) return;
    const res = await fetch(`/api/capillas/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar.");
      return;
    }
    cargar();
  }

  const campo = "rounded-xl border-2 border-cielo/15 bg-white px-3 py-2 outline-none focus:border-cielo";

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-tinta">Capillas</h1>

      <form onSubmit={guardar} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Nombre</span>
          <input className={campo} required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <button className="rounded-full bg-cielo px-5 py-2.5 font-display font-bold text-white hover:bg-cielo-oscuro">
          {editandoId ? "Guardar cambios" : "+ Agregar"}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setNombre("");
            }}
            className="text-sm font-bold text-tinta-suave"
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="flex flex-col gap-2">
        {lista.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
            <p className="text-sm font-semibold text-tinta">{c.nombre}</p>
            <div className="flex gap-2">
              <button onClick={() => editar(c)} className="rounded-full bg-cielo/10 px-3 py-1 text-xs font-bold text-cielo">
                Editar
              </button>
              <button onClick={() => eliminar(c.id)} className="rounded-full bg-girasol/10 px-3 py-1 text-xs font-bold text-girasol">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
