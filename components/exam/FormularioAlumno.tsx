"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { DatosAlumno, Examen } from "@/types/exam";

const campoBase =
  "w-full rounded-2xl border-2 border-cielo/15 bg-white px-4 py-3 text-tinta placeholder:text-tinta-suave/60 outline-none transition-colors focus:border-cielo";

const MENSAJE_POR_DEFECTO = `Queridos padres de familia: En esta nueva experiencia de la era digital, nos atrevemos a incluir, en el proceso catequético, estas herramientas de gran utilidad; sin embargo, sabemos que tienen sus riesgos si no las sabemos utilizar. Esta es una gran oportunidad para demostrar que ustedes pueden ser honestos en la realización de este examen-diagnóstico, de contestar única y solamente lo que han enseñado a sus hijos, sin la necesidad de googlear y/o copiar lo que no se ha aprendido. Contamos con su participación en bien de sus hijos.

Atte. Presbítero Manuel Antonio Mojica Cabrera.`;

export default function FormularioAlumno({
  examen,
  parroquiaFija,
  onListo,
}: {
  examen: Examen;
  parroquiaFija?: string;
  onListo: (datos: DatosAlumno, checkboxesMarcados: number[]) => void;
}) {
  const [datos, setDatos] = useState<DatosAlumno>({
    nombreCompleto: "",
    edad: "",
    sexo: "",
    capilla: "",
    catequista: "",
    grupo: "",
    nivel: "",
    parroquia: parroquiaFija ?? "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [capillas, setCapillas] = useState<string[]>([]);
  const [catequistas, setCatequistas] = useState<string[]>([]);
  const [checkboxes, setCheckboxes] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [errorLectura, setErrorLectura] = useState("");

  useEffect(() => {
    fetch("/api/capillas")
      .then((r) => r.json())
      .then((data) => setCapillas(data.map((c: { nombre: string }) => c.nombre)))
      .catch(() => {});
    fetch("/api/catequistas")
      .then((r) => r.json())
      .then((data) => setCatequistas(data.map((c: { nombre: string }) => c.nombre)))
      .catch(() => {});
  }, []);

  function actualizar<K extends keyof DatosAlumno>(campo: K, valor: DatosAlumno[K]) {
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  function alternarCheckbox(i: 0 | 1 | 2) {
    setCheckboxes((prev) => {
      const copia: [boolean, boolean, boolean] = [...prev];
      copia[i] = !copia[i];
      return copia;
    });
  }

  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {};
    if (!datos.nombreCompleto.trim()) nuevosErrores.nombreCompleto = "Escribe tu nombre completo.";
    if (!datos.capilla.trim()) nuevosErrores.capilla = "Indica tu capilla.";
    if (!datos.catequista.trim()) nuevosErrores.catequista = "Indica el nombre de tu catequista.";
    setErrores(nuevosErrores);

    setErrorLectura("");
    if (examen.checkboxCorrecta) {
      const marcadas = checkboxes.filter(Boolean).length;
      const correctaMarcada = checkboxes[examen.checkboxCorrecta - 1];
      if (marcadas !== 1 || !correctaMarcada) {
        setErrorLectura("Lee el mensaje con atención y marca la casilla que se indica.");
        return false;
      }
    }
    return Object.keys(nuevosErrores).length === 0;
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (validar()) {
      const checkboxesMarcados = checkboxes
        .map((marcada, i) => (marcada ? i + 1 : null))
        .filter((v): v is number => v !== null);
      onListo({ ...datos, edad: datos.edad === "" ? 0 : datos.edad }, checkboxesMarcados);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-6 py-10"
    >
      <Image
        src="/logo-vicaria.png"
        alt="Vicaría Fija San Felipe de Jesús"
        width={64}
        height={64}
        className="mb-3 self-center rounded-full shadow-sm"
      />
      <h2 className="mb-1 font-display text-2xl font-extrabold text-tinta">Antes de empezar</h2>
      <div className="mb-4 rounded-2xl border-2 border-sol/40 bg-sol/10 p-4 text-sm leading-relaxed text-tinta">
        <p className="whitespace-pre-line">{examen.mensajeEncabezado || MENSAJE_POR_DEFECTO}</p>

        {examen.checkboxCorrecta && (
          <div className="mt-4 flex flex-col gap-2 border-t border-sol/30 pt-4">
            {[0, 1, 2].map((i) => (
              <label key={i} className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={checkboxes[i]}
                  onChange={() => alternarCheckbox(i as 0 | 1 | 2)}
                />
                Casilla {i + 1}
              </label>
            ))}
            {errorLectura && <p className="text-sm font-bold text-girasol">{errorLectura}</p>}
          </div>
        )}
      </div>
      <p className="mb-6 text-tinta-suave">Cuéntanos un poco sobre ti.</p>

      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <Campo label="Nombre completo" requerido error={errores.nombreCompleto}>
          <input
            className={campoBase}
            value={datos.nombreCompleto}
            onChange={(e) => actualizar("nombreCompleto", e.target.value)}
            placeholder="Ej. María López García"
          />
        </Campo>

        <Campo label="Sexo" requerido>
          <select
            className={campoBase}
            value={datos.sexo}
            onChange={(e) => actualizar("sexo", e.target.value)}
          >
            <option value="">Selecciona...</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>
        </Campo>

        <Campo label="Capilla" requerido error={errores.capilla}>
          <select
            className={campoBase}
            value={datos.capilla}
            onChange={(e) => actualizar("capilla", e.target.value)}
          >
            <option value="">Selecciona tu capilla...</option>
            {capillas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Catequista" requerido error={errores.catequista}>
          <select
            className={campoBase}
            value={datos.catequista}
            onChange={(e) => actualizar("catequista", e.target.value)}
          >
            <option value="">Selecciona a tu catequista...</option>
            {catequistas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Sacramento (opcional)">
            <select
              className={campoBase}
              value={datos.grupo}
              onChange={(e) => actualizar("grupo", e.target.value)}
            >
              <option value="">Selecciona...</option>
              <option value="Catecúmeno">Catecúmeno</option>
              <option value="Confirmación">Confirmación</option>
              <option value="Comunión">Comunión</option>
            </select>
          </Campo>
          <Campo label="Generación (opcional)">
            <input
              className={campoBase}
              value={datos.nivel}
              onChange={(e) => actualizar("nivel", e.target.value)}
              placeholder="Ej. 2026"
            />
          </Campo>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="mt-4 rounded-full bg-cielo px-8 py-4 font-display text-lg font-extrabold text-white shadow-lg shadow-cielo/30 transition-colors hover:bg-cielo-oscuro"
        >
          Continuar →
        </motion.button>
      </form>
    </motion.div>
  );
}

function Campo({
  label,
  requerido,
  error,
  children,
}: {
  label: string;
  requerido?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-display text-sm font-bold text-tinta">
        {label} {requerido && <span className="text-girasol">*</span>}
      </span>
      {children}
      {error && <span className="text-sm font-semibold text-girasol">{error}</span>}
    </label>
  );
}
