"use client";

import { useEffect, useState } from "react";
import SubirImagen from "@/components/admin/SubirImagen";

interface Config {
  titulo: string;
  textoPrincipal: string;
  textoSecundario: string;
  colorPrimario: string;
  colorAcento: string;
  colorTexto: string;
  fuente: string;
  logoUrl?: string | null;
  firmaUrl?: string | null;
  selloUrl?: string | null;
}

const campo = "w-full rounded-xl border-2 border-cielo/15 bg-white px-3 py-2 outline-none focus:border-cielo";

export default function CertificadoConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/configuracion-certificado")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/configuracion-certificado", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setGuardando(false);
    if (res.ok) setMensaje("✅ Guardado. Los próximos certificados usarán este diseño.");
    else {
      const data = await res.json().catch(() => ({}));
      setMensaje(data.error ?? "No se pudo guardar.");
    }
  }

  if (!config) return <p className="text-tinta-suave">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-2xl font-extrabold text-tinta">Diseño del certificado</h1>
      <p className="mb-6 text-sm text-tinta-suave">
        Personaliza el texto, colores, tipografía e imágenes del certificado PDF que reciben los alumnos aprobados.
        Usa <code>{"{nombre}"}</code>, <code>{"{examen}"}</code>, <code>{"{calificacion}"}</code>,{" "}
        <code>{"{catequista}"}</code>, <code>{"{capilla}"}</code>, <code>{"{folio}"}</code> como marcadores en el
        texto secundario.
      </p>

      <form onSubmit={guardar} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Título</span>
          <input className={campo} value={config.titulo} onChange={(e) => setConfig({ ...config, titulo: e.target.value })} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Texto principal (arriba del nombre)</span>
          <input
            className={campo}
            value={config.textoPrincipal}
            onChange={(e) => setConfig({ ...config, textoPrincipal: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Texto secundario (debajo del nombre, admite marcadores)</span>
          <textarea
            className={campo}
            rows={3}
            value={config.textoSecundario}
            onChange={(e) => setConfig({ ...config, textoSecundario: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Color primario</span>
            <input
              type="color"
              className="h-10 w-full rounded-lg border-2 border-cielo/15"
              value={config.colorPrimario}
              onChange={(e) => setConfig({ ...config, colorPrimario: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Color de acento</span>
            <input
              type="color"
              className="h-10 w-full rounded-lg border-2 border-cielo/15"
              value={config.colorAcento}
              onChange={(e) => setConfig({ ...config, colorAcento: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Color de texto</span>
            <input
              type="color"
              className="h-10 w-full rounded-lg border-2 border-cielo/15"
              value={config.colorTexto}
              onChange={(e) => setConfig({ ...config, colorTexto: e.target.value })}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Tipografía</span>
          <select className={campo} value={config.fuente} onChange={(e) => setConfig({ ...config, fuente: e.target.value })}>
            <option value="Helvetica">Helvetica (moderna)</option>
            <option value="TimesRoman">Times Roman (clásica/serif)</option>
            <option value="Courier">Courier (máquina de escribir)</option>
          </select>
        </label>

        <SubirImagen
          etiqueta="Logo (aparece arriba del título)"
          valor={config.logoUrl ?? undefined}
          onCambiar={(url) => setConfig({ ...config, logoUrl: url })}
        />
        <SubirImagen
          etiqueta="Firma escaneada (opcional)"
          valor={config.firmaUrl ?? undefined}
          onCambiar={(url) => setConfig({ ...config, firmaUrl: url })}
        />
        <SubirImagen
          etiqueta="Sello institucional (opcional)"
          valor={config.selloUrl ?? undefined}
          onCambiar={(url) => setConfig({ ...config, selloUrl: url })}
        />

        {mensaje && <p className="text-sm font-semibold text-tinta">{mensaje}</p>}

        <button
          disabled={guardando}
          className="mt-2 self-start rounded-full bg-cielo px-6 py-2.5 font-display font-extrabold text-white hover:bg-cielo-oscuro disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar diseño"}
        </button>
      </form>
    </div>
  );
}
