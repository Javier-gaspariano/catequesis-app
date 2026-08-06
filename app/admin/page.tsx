import { prisma } from "@/lib/prisma";
import FiltrosDashboard from "@/components/admin/FiltrosDashboard";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ examenId?: string; sacramento?: string }>;
}) {
  const { examenId, sacramento } = await searchParams;
  const filtroIntento = {
    ...(examenId && { examenId }),
    ...(sacramento && { grupo: sacramento }),
  };

  const [
    examenes,
    examenesPublicados,
    preguntas,
    intentos,
    aprobados,
    reprobados,
    catequistas,
    capillas,
    certificados,
    promedios,
    tiempos,
    listaExamenes,
  ] = await Promise.all([
    prisma.examen.count(),
    prisma.examen.count({ where: { estado: "PUBLICADO" } }),
    prisma.pregunta.count(),
    prisma.intento.count({ where: { estado: "FINALIZADO", ...filtroIntento } }),
    prisma.resultado.count({ where: { aprobado: true, intento: filtroIntento } }),
    prisma.resultado.count({ where: { aprobado: false, intento: filtroIntento } }),
    prisma.catequista.count(),
    prisma.capilla.count(),
    prisma.certificado.count({ where: { intento: filtroIntento } }),
    prisma.resultado.aggregate({ _avg: { calificacion: true }, where: { intento: filtroIntento } }),
    prisma.intento.findMany({
      where: { estado: "FINALIZADO", tiempoSegundos: { not: null }, ...filtroIntento },
      select: { tiempoSegundos: true },
    }),
    prisma.examen.findMany({ select: { id: true, titulo: true }, orderBy: { titulo: "asc" } }),
  ]);

  const tiempoPromedioMin = tiempos.length
    ? Math.round(
        (tiempos.reduce((a, b) => a + (b.tiempoSegundos ?? 0), 0) / tiempos.length / 60) * 10
      ) / 10
    : 0;
  const porcentajeAprobacion = intentos > 0 ? Math.round((aprobados / intentos) * 1000) / 10 : 0;

  const tarjetas = [
    { label: "Exámenes totales", valor: examenes, color: "bg-cielo/10 text-cielo" },
    { label: "Exámenes publicados", valor: examenesPublicados, color: "bg-cielo/10 text-cielo" },
    { label: "Preguntas en banco", valor: preguntas, color: "bg-hoja/10 text-hoja" },
    { label: "Participantes", valor: intentos, color: "bg-sol/20 text-tinta" },
    { label: "Aprobados", valor: aprobados, color: "bg-hoja/10 text-hoja" },
    { label: "Reprobados", valor: reprobados, color: "bg-girasol/10 text-girasol" },
    { label: "% de aprobación", valor: `${porcentajeAprobacion}%`, color: "bg-hoja/10 text-hoja" },
    {
      label: "Promedio general",
      valor: promedios._avg.calificacion ? Math.round(promedios._avg.calificacion * 10) / 10 : "—",
      color: "bg-cielo/10 text-cielo",
    },
    { label: "Tiempo promedio", valor: `${tiempoPromedioMin} min`, color: "bg-sol/20 text-tinta" },
    { label: "Certificados emitidos", valor: certificados, color: "bg-girasol/10 text-girasol" },
    { label: "Catequistas activos", valor: catequistas, color: "bg-hoja/10 text-hoja" },
    { label: "Capillas registradas", valor: capillas, color: "bg-cielo/10 text-cielo" },
  ];

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-extrabold text-tinta">Dashboard</h1>
      <Suspense fallback={null}>
        <FiltrosDashboard examenes={listaExamenes} />
      </Suspense>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.label} className={`rounded-2xl p-5 ${t.color}`}>
            <p className="text-3xl font-extrabold font-display">{t.valor}</p>
            <p className="text-sm font-semibold opacity-80">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
