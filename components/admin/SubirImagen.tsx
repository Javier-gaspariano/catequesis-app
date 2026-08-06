"use client";

import { useState } from "react";
import Image from "next/image";

export default function SubirImagen({
  valor,
  onCambiar,
  etiqueta = "Imagen",
}: {
  valor?: string;
  onCambiar: (url: string) => void;
  etiqueta?: string;
}) {
  const [subiendo, setSubiendo] = useState(false);

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await res.json();
    setSubiendo(false);
    if (res.ok) onCambiar(data.url);
    else alert(data.error ?? "Error al subir la imagen.");
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-tinta">{etiqueta}</span>
      <div className="flex items-center gap-3">
        {valor && (
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-cielo/15">
            <Image src={valor} alt="" fill sizes="64px" className="object-cover" />
          </div>
        )}
        <label className="cursor-pointer rounded-full bg-cielo/10 px-4 py-2 text-sm font-bold text-cielo">
          {subiendo ? "Subiendo..." : "Subir imagen"}
          <input type="file" accept="image/*" className="hidden" onChange={manejarArchivo} />
        </label>
        <input
          placeholder="o pega una URL"
          value={valor ?? ""}
          onChange={(e) => onCambiar(e.target.value)}
          className="flex-1 rounded-full border-2 border-cielo/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-cielo"
        />
      </div>
    </div>
  );
}
