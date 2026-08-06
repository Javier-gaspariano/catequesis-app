"use client";

import { useEffect, useState } from "react";

interface Catequista {
  id: string;
  nombre: string;
  email?: string | null;
}

export default function Catequistas() {
  const [lista, setLista] = useState<Catequista[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/catequistas");
    setLista(await res.json());
  }
  useEffect(() => {
    cargar();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const url = editandoId ? `/api/catequistas/${editandoId}` : "/api/catequistas";
    await fetch(url, {
      method: editandoId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email: email || undefined }),
    });
    setNombre("");
    setEmail("");
    setEditandoId(null);
    cargar();
  }

  function editar(c: Catequista) {
    setEditandoId(c.id);
    setNombre(c.nombre);
    setEmail(c.email ?? "");
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este catequista?")) return;
    const res = await fetch(`/api/catequistas/${id}`, { method: "DELETE" });
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
      <h1 className="mb-6 font-display text-2xl font-extrabold text-tinta">Catequistas</h1>

      <form onSubmit={guardar} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Nombre</span>
          <input className={campo} required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Correo (opcional)</span>
          <input className={campo} value={email} onChange={(e) => setEmail(e.target.value)} />
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
              setEmail("");
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
            <div>
              <p className="text-sm font-semibold text-tinta">{c.nombre}</p>
              {c.email && <p className="text-xs text-tinta-suave">{c.email}</p>}
            </div>
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
