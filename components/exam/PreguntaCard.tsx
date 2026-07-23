"use client";

import { motion, Reorder } from "framer-motion";
import Image from "next/image";
import { Pregunta, ValorRespuesta } from "@/types/exam";
import OpcionBoton from "./OpcionBoton";
import { useState, useEffect } from "react";

export default function PreguntaCard({
  pregunta,
  valor,
  onCambiar,
}: {
  pregunta: Pregunta;
  valor: ValorRespuesta;
  onCambiar: (valor: ValorRespuesta) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      {pregunta.imagenUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-52 w-full overflow-hidden rounded-3xl shadow-md"
        >
          <Image src={pregunta.imagenUrl} alt="" fill sizes="600px" className="object-cover" />
        </motion.div>
      )}

      <h2 className="font-display text-xl font-extrabold leading-snug text-tinta sm:text-2xl">
        {pregunta.enunciado}
      </h2>

      {pregunta.audioUrl && (
        <audio controls className="w-full">
          <source src={pregunta.audioUrl} />
        </audio>
      )}

      {pregunta.videoUrl && (
        <video controls className="w-full rounded-3xl shadow-md">
          <source src={pregunta.videoUrl} />
        </video>
      )}

      {(pregunta.tipo === "RESPUESTA_UNICA" ||
        pregunta.tipo === "VERDADERO_FALSO" ||
        pregunta.tipo === "IMAGEN_RESPUESTA" ||
        pregunta.tipo === "BASADA_FOTOGRAFIA" ||
        pregunta.tipo === "BASADA_AUDIO" ||
        pregunta.tipo === "BASADA_VIDEO") && (
        <div className="flex flex-col gap-3">
          {pregunta.opciones.map((op) => (
            <OpcionBoton
              key={op.id}
              texto={op.texto}
              imagenUrl={op.imagenUrl}
              seleccionada={valor === op.id}
              onClick={() => onCambiar(op.id)}
            />
          ))}
        </div>
      )}

      {pregunta.tipo === "RELACIONAR_COLUMNAS" && (
        <RelacionarColumnas pregunta={pregunta} valor={valor} onCambiar={onCambiar} />
      )}

      {pregunta.tipo === "SELECCION_MULTIPLE" && (
        <SeleccionMultiple pregunta={pregunta} valor={valor} onCambiar={onCambiar} />
      )}

      {pregunta.tipo === "ORDENAR_ELEMENTOS" && (
        <OrdenarElementos pregunta={pregunta} valor={valor} onCambiar={onCambiar} />
      )}

      {pregunta.tipo === "COMPLETAR_ESPACIOS" && (
        <input
          className="w-full rounded-2xl border-2 border-cielo/15 bg-white px-4 py-3 text-tinta outline-none focus:border-cielo"
          placeholder="Escribe tu respuesta..."
          value={typeof valor === "string" ? valor : ""}
          onChange={(e) => onCambiar(e.target.value)}
        />
      )}
    </div>
  );
}

function SeleccionMultiple({
  pregunta,
  valor,
  onCambiar,
}: {
  pregunta: Pregunta;
  valor: ValorRespuesta;
  onCambiar: (v: ValorRespuesta) => void;
}) {
  const seleccion = Array.isArray(valor) ? valor : [];
  function toggle(id: string) {
    const nueva = seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id];
    onCambiar(nueva);
  }
  return (
    <div className="flex flex-col gap-3">
      {pregunta.opciones.map((op) => (
        <OpcionBoton
          key={op.id}
          texto={op.texto}
          imagenUrl={op.imagenUrl}
          seleccionada={seleccion.includes(op.id)}
          onClick={() => toggle(op.id)}
        />
      ))}
    </div>
  );
}

const COLORES_PAREJA = [
  { borde: "border-cielo", fondo: "bg-cielo/15", texto: "text-cielo-oscuro" },
  { borde: "border-hoja", fondo: "bg-hoja/15", texto: "text-hoja" },
  { borde: "border-girasol", fondo: "bg-girasol/15", texto: "text-girasol" },
  { borde: "border-sol", fondo: "bg-sol/25", texto: "text-tinta" },
  { borde: "border-purple-400", fondo: "bg-purple-100", texto: "text-purple-600" },
  { borde: "border-pink-400", fondo: "bg-pink-100", texto: "text-pink-600" },
];

function RelacionarColumnas({
  pregunta,
  valor,
  onCambiar,
}: {
  pregunta: Pregunta;
  valor: ValorRespuesta;
  onCambiar: (v: ValorRespuesta) => void;
}) {
  const parejas = (typeof valor === "object" && !Array.isArray(valor) ? valor : {}) as Record<
    string,
    string
  >;
  const [seleccionA, setSeleccionA] = useState<string | null>(null);

  const opcionesA = pregunta.opciones.filter((o) => o.grupo === "A");
  const opcionesB = pregunta.opciones.filter((o) => o.grupo === "B");

  // índice de color estable por opción A (orden en que aparece en la columna A)
  const colorPorA = new Map(opcionesA.map((a, i) => [a.id, COLORES_PAREJA[i % COLORES_PAREJA.length]]));
  const bYaUsadaDe = new Map<string, string>(); // idB -> idA que la usa
  Object.entries(parejas).forEach(([idA, idB]) => bYaUsadaDe.set(idB, idA));

  function elegirA(id: string) {
    // tocar de nuevo la misma A ya emparejada la desmarca (permite corregir)
    if (seleccionA === id) {
      setSeleccionA(null);
      return;
    }
    setSeleccionA(id);
  }

  function elegirB(idB: string) {
    const aQueYaUsaEstaB = bYaUsadaDe.get(idB);
    if (!seleccionA) {
      // tocar una B ya usada, sin A seleccionada, la desconecta (para corregir)
      if (aQueYaUsaEstaB) {
        const copia = { ...parejas };
        delete copia[aQueYaUsaEstaB];
        onCambiar(copia);
      }
      return;
    }
    const copia = { ...parejas };
    // si esa B ya estaba tomada por otra A, libera esa pareja primero
    if (aQueYaUsaEstaB) delete copia[aQueYaUsaEstaB];
    copia[seleccionA] = idB;
    onCambiar(copia);
    setSeleccionA(null);
  }

  function quitarPareja(idA: string) {
    const copia = { ...parejas };
    delete copia[idA];
    onCambiar(copia);
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-tinta-suave">
        Toca un elemento de la columna A y luego su pareja en la columna B. Toca una pareja ya hecha
        para corregirla 👇
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {opcionesA.map((a) => {
            const color = colorPorA.get(a.id)!;
            const emparejada = !!parejas[a.id];
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => (emparejada ? quitarPareja(a.id) : elegirA(a.id))}
                className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  seleccionA === a.id
                    ? "border-tinta bg-tinta/10"
                    : emparejada
                    ? `${color.borde} ${color.fondo} ${color.texto}`
                    : "border-cielo/15 bg-white"
                }`}
              >
                {a.texto} {emparejada && "✕"}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {opcionesB.map((b) => {
            const idADueña = bYaUsadaDe.get(b.id);
            const color = idADueña ? colorPorA.get(idADueña) : null;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => elegirB(b.id)}
                className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  color ? `${color.borde} ${color.fondo} ${color.texto}` : "border-cielo/15 bg-white"
                }`}
              >
                {b.texto} {color && "✕"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OrdenarElementos({
  pregunta,
  valor,
  onCambiar,
}: {
  pregunta: Pregunta;
  valor: ValorRespuesta;
  onCambiar: (v: ValorRespuesta) => void;
}) {
  const idsIniciales = Array.isArray(valor) && valor.length ? valor : pregunta.opciones.map((o) => o.id);
  const [orden, setOrden] = useState<string[]>(idsIniciales);

  useEffect(() => {
    onCambiar(orden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden]);

  const mapa = Object.fromEntries(pregunta.opciones.map((o) => [o.id, o]));

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-tinta-suave">Arrastra para ordenar 👇</p>
      <Reorder.Group axis="y" values={orden} onReorder={setOrden} className="flex flex-col gap-3">
        {orden.map((id) => (
          <Reorder.Item
            key={id}
            value={id}
            whileDrag={{ scale: 1.04 }}
            className="flex cursor-grab items-center gap-3 rounded-2xl border-2 border-sol/40 bg-white px-5 py-4 font-semibold text-tinta shadow-sm active:cursor-grabbing"
          >
            <span className="text-tinta-suave">⠿</span>
            {mapa[id]?.texto}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
