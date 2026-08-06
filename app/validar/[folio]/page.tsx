import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ValidarCertificado({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const certificado = await prisma.certificado.findUnique({
    where: { folio },
    include: { intento: { include: { examen: true, resultado: true } } },
  });

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      {certificado ? (
        <>
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="font-display text-2xl font-extrabold text-tinta">Certificado válido</h1>
          <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-bold text-tinta">{certificado.intento.nombreCompleto}</p>
            <p className="text-tinta-suave">{certificado.intento.examen.titulo}</p>
            <p className="text-sm text-tinta-suave">
              Calificación: {certificado.intento.resultado?.calificacion} · Folio: {certificado.folio}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 text-5xl">❌</div>
          <h1 className="font-display text-2xl font-extrabold text-tinta">Folio no encontrado</h1>
          <p className="text-tinta-suave">Este certificado no existe o el folio es incorrecto.</p>
        </>
      )}
    </main>
  );
}
