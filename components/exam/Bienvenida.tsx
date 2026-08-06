"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Examen } from "@/types/exam";

export default function Bienvenida({
  examen,
  onComenzar,
}: {
  examen: Examen;
  onComenzar: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-10 text-center"
    >
      {/* blobs decorativos */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sol/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cielo/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-40 w-40 rounded-full bg-hoja/30 blur-2xl" />

      {examen.imagenPortadaUrl && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative mb-6 h-40 w-40 overflow-hidden rounded-[2.2rem] border-4 border-white shadow-xl shadow-cielo/20 sm:h-48 sm:w-48"
        >
          <Image
            src={examen.imagenPortadaUrl}
            alt=""
            fill
            sizes="192px"
            className="object-cover"
            priority
          />
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-girasol"
      >
        ¡Bienvenido catequizando!
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="max-w-xl font-display text-3xl font-extrabold text-tinta sm:text-4xl"
      >
        {examen.titulo}
      </motion.h1>

      {examen.descripcion && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-3 max-w-md text-tinta-suave"
        >
          {examen.descripcion}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-2 flex items-center gap-4 text-sm text-tinta-suave"
      >
        <span>📋 {examen.preguntas.length} preguntas</span>
        {examen.tiempoMaximoMin && <span>⏱ {examen.tiempoMaximoMin} min</span>}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onComenzar}
        className="mt-10 rounded-full bg-girasol px-12 py-4 font-display text-xl font-extrabold text-white shadow-lg shadow-girasol/40 transition-colors hover:bg-cielo-oscuro"
      >
        Comenzar 🚀
      </motion.button>
    </motion.div>
  );
}
