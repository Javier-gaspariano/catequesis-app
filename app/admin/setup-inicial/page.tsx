"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupInicial() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/setup-inicial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setListo(true);
      setTimeout(() => router.push("/admin/login"), 1500);
    } else {
      setError(data.error);
    }
  }

  if (listo) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-6 text-center">
        <p className="font-display text-xl font-extrabold text-hoja">
          ✅ Administrador creado. Redirigiendo al login...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-crema px-6">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center font-display text-xl font-extrabold text-tinta">
          Configuración inicial
        </h1>
        <p className="mb-6 text-center text-sm text-tinta-suave">
          Crea la primera cuenta de Administrador General. Esto solo funciona una vez.
        </p>
        <label className="mb-3 flex flex-col gap-1">
          <span className="text-sm font-bold">Nombre</span>
          <input
            required
            className="rounded-xl border-2 border-cielo/15 px-3 py-2 outline-none focus:border-cielo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <label className="mb-3 flex flex-col gap-1">
          <span className="text-sm font-bold">Correo</span>
          <input
            type="email"
            required
            className="rounded-xl border-2 border-cielo/15 px-3 py-2 outline-none focus:border-cielo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="mb-4 flex flex-col gap-1">
          <span className="text-sm font-bold">Contraseña (mínimo 8 caracteres)</span>
          <input
            type="password"
            required
            minLength={8}
            className="rounded-xl border-2 border-cielo/15 px-3 py-2 outline-none focus:border-cielo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="mb-3 text-sm font-semibold text-girasol">{error}</p>}
        <button className="w-full rounded-full bg-cielo py-3 font-display font-extrabold text-white hover:bg-cielo-oscuro">
          Crear administrador
        </button>
      </form>
    </main>
  );
}
