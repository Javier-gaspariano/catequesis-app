"use client";

import { useRouter } from "next/navigation";

export default function BotonSalir() {
  const router = useRouter();
  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button onClick={salir} className="text-sm font-bold text-girasol">
      Cerrar sesión
    </button>
  );
}
