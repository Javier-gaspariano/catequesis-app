"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setCargando(false);
    if (res.ok) {
      router.push(params.get("redirigir") ?? "/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "No se pudo iniciar sesión.");
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-crema px-6">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center font-display text-2xl font-extrabold text-tinta">
          Panel Administrativo
        </h1>
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
          <span className="text-sm font-bold">Contraseña</span>
          <input
            type="password"
            required
            className="rounded-xl border-2 border-cielo/15 px-3 py-2 outline-none focus:border-cielo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="mb-3 text-sm font-semibold text-girasol">{error}</p>}
        <button
          disabled={cargando}
          className="w-full rounded-full bg-cielo py-3 font-display font-extrabold text-white hover:bg-cielo-oscuro disabled:opacity-50"
        >
          {cargando ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
