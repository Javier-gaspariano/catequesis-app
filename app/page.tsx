import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-3xl font-extrabold text-tinta">
        Sistema Inteligente de Evaluaciones
        <br /> para Catequesis Infantil
      </h1>
      <p className="max-w-md text-tinta-suave">
        Fase 2 en construcción: flujo de examen para el alumno.
      </p>
      <Link
        href="/examen/demo"
        className="rounded-full bg-cielo px-8 py-3 font-display font-extrabold text-white shadow-md hover:bg-cielo-oscuro"
      >
        Ver examen de ejemplo →
      </Link>
    </main>
  );
}
