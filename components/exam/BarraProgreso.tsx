"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function BarraProgreso({
  actual,
  total,
  tiempoTranscurrido,
}: {
  actual: number; // índice base 0
  total: number;
  tiempoTranscurrido: string;
}) {
  const porcentaje = ((actual + 1) / total) * 100;

  return (
    <div className="sticky top-0 z-10 bg-crema/90 px-6 pb-4 pt-6 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-start justify-between">
        <div className="flex-1" />
        <Image
          src="/logo-vicaria.png"
          alt="Vicaría Fija San Felipe de Jesús"
          width={56}
          height={56}
          className="rounded-full shadow-sm"
        />
      </div>
      <div className="mx-auto flex max-w-2xl items-center justify-between text-sm font-bold text-tinta-suave">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          Pregunta {actual + 1} de {total}
        </span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">⏱ {tiempoTranscurrido}</span>
      </div>
      <div className="mx-auto mt-3 h-3 w-full max-w-2xl overflow-hidden rounded-full bg-white shadow-inner">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cielo via-hoja to-sol"
          initial={{ width: 0 }}
          animate={{ width: `${porcentaje}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
