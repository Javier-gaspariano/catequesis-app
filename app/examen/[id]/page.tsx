import ExamRunner from "@/components/exam/ExamRunner";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function PaginaExamen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await headers();
  const origen = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const res = await fetch(`${origen}/api/examenes/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-6 text-center">
        <p className="font-display text-xl font-bold text-tinta">Este examen no está disponible.</p>
      </main>
    );
  }
  const examen = await res.json();
  return <ExamRunner examen={examen} />;
}
