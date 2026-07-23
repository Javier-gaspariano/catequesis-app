"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import BotonSalir from "@/components/admin/BotonSalir";

interface ItemNav {
  href: string;
  label: string;
  icon: string;
}

interface Sesion {
  nombre: string;
  rol: string;
}

export default function AdminNav({ nav, sesion }: { nav: ItemNav[]; sesion: Sesion | null }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* barra superior móvil */}
      <header className="flex items-center justify-between border-b border-cielo/10 bg-white p-4 sm:hidden">
        <p className="font-display text-lg font-extrabold text-cielo">Catequesis Admin</p>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-2xl leading-none text-cielo"
        >
          ☰
        </button>
      </header>

      {/* menú deslizable móvil */}
      {abierto && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-tinta/40" onClick={() => setAbierto(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-72 flex-col bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-lg font-extrabold text-cielo">Menú</p>
              <button onClick={() => setAbierto(false)} className="text-2xl leading-none text-tinta-suave">
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 font-semibold transition-colors ${
                    pathname === item.href ? "bg-cielo/10 text-cielo" : "text-tinta-suave hover:bg-cielo/10 hover:text-cielo"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
            </nav>
            {sesion && (
              <div className="mt-auto border-t border-cielo/10 pt-4">
                <p className="text-sm font-bold text-tinta">{sesion.nombre}</p>
                <p className="mb-3 text-xs text-tinta-suave">{sesion.rol.replaceAll("_", " ")}</p>
                <BotonSalir />
              </div>
            )}
          </aside>
        </div>
      )}

      {/* menú lateral de escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-cielo/10 bg-white p-5 sm:flex">
        <p className="mb-8 font-display text-lg font-extrabold text-cielo">Catequesis Admin</p>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 font-semibold transition-colors ${
                pathname === item.href ? "bg-cielo/10 text-cielo" : "text-tinta-suave hover:bg-cielo/10 hover:text-cielo"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        {sesion && (
          <div className="mt-auto border-t border-cielo/10 pt-4">
            <p className="text-sm font-bold text-tinta">{sesion.nombre}</p>
            <p className="mb-3 text-xs text-tinta-suave">{sesion.rol.replaceAll("_", " ")}</p>
            <BotonSalir />
          </div>
        )}
      </aside>
    </>
  );
}
