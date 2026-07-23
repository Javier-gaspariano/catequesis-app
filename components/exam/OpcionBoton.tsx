"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function OpcionBoton({
  texto,
  imagenUrl,
  seleccionada,
  onClick,
}: {
  texto?: string;
  imagenUrl?: string;
  seleccionada: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      animate={
        seleccionada
          ? { scale: [1, 1.08, 1], y: [0, -4, 0] }
          : { scale: 1, y: 0 }
      }
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      className={[
        "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border-2 px-5 py-4 text-left font-semibold transition-colors",
        seleccionada
          ? "border-hoja bg-hoja/15 text-tinta shadow-lg shadow-hoja/20"
          : "border-cielo/15 bg-white text-tinta hover:border-cielo/40",
      ].join(" ")}
    >
      {seleccionada && (
        <motion.span
          initial={{ opacity: 0.6, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-hoja/40"
        />
      )}
      {imagenUrl && (
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <Image src={imagenUrl} alt="" fill sizes="56px" className="object-cover" />
        </span>
      )}
      {texto && <span className="relative">{texto}</span>}
      {seleccionada && <span className="relative ml-auto text-lg">✅</span>}
    </motion.button>
  );
}
