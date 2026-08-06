import { prisma } from "@/lib/prisma";
import { resumirValorRespuesta } from "@/lib/resumir-respuesta";
import BotonImprimir from "@/components/admin/BotonImprimir";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface EventoFoco {
  preguntaNumero: number;
  preguntaEnunciado: string;
  momento: string;
}

export default async function ImprimirExamen({ params }: { params: Promise<{ intentoId: string }> }) {
  const { intentoId } = await params;

  const intento = await prisma.intento.findUnique({
    where: { id: intentoId },
    include: {
      examen: { include: { preguntas: { include: { pregunta: { include: { opciones: true } } }, orderBy: { orden: "asc" } } } },
      capilla: true,
      catequista: true,
      resultado: true,
      respuestas: true,
    },
  });

  if (!intento) {
    return <p className="p-8 text-tinta-suave">Examen no encontrado.</p>;
  }

  const eventosFoco = (intento.eventosFoco as unknown as EventoFoco[] | null) ?? [];

  return (
    <div className="mx-auto max-w-[8.5in] bg-white p-8 text-tinta print:p-[0.6in]">
      <BotonImprimir />

      {/* encabezado */}
      <div className="mb-4 flex items-center gap-4 border-b-2 border-cielo/20 pb-3">
        <Image src="/logo-vicaria.png" alt="Logo" width={56} height={56} className="rounded-full" />
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold text-cielo">{intento.examen.titulo}</p>
          <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] text-tinta">
            <p>
              <strong>Nombre:</strong> {intento.nombreCompleto}
            </p>
            <p>
              <strong>Calificación:</strong>{" "}
              {intento.resultado ? `${intento.resultado.calificacion} (${intento.resultado.aprobado ? "Aprobado" : "No aprobado"})` : "—"}
            </p>
            <p>
              <strong>Capilla:</strong> {intento.capilla?.nombre ?? "—"}
            </p>
            <p>
              <strong>Catequista:</strong> {intento.catequista?.nombre ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* preguntas y respuestas */}
      <div className="flex flex-col gap-1.5">
        {intento.examen.preguntas.map((ep, i) => {
          const pregunta = ep.pregunta;
          const respuesta = intento.respuestas.find((r) => r.preguntaId === pregunta.id);
          const textoRespuesta = respuesta
            ? resumirValorRespuesta(pregunta.tipo, respuesta.valorJson, pregunta.opciones, respuesta.valorRecuperadoTexto)
            : "(sin responder)";
          return (
            <div key={pregunta.id} className="break-inside-avoid text-[11px] leading-snug">
              <p>
                <strong>
                  {i + 1}. {pregunta.enunciado}
                </strong>
              </p>
              <p className={respuesta?.esCorrecta === false ? "text-girasol" : respuesta?.esCorrecta ? "text-hoja" : "text-tinta-suave"}>
                Respuesta: {textoRespuesta} {respuesta?.esCorrecta === true && "✓"} {respuesta?.esCorrecta === false && "✗"}
              </p>
            </div>
          );
        })}
      </div>

      {/* salidas de pantalla */}
      <div className="mt-4 border-t-2 border-cielo/20 pt-2 text-[11px]">
        <p>
          <strong>Veces que salió de la pantalla del examen:</strong> {intento.cambiosFoco}
        </p>
        {eventosFoco.length > 0 && (
          <p className="text-tinta-suave">
            Preguntas: {eventosFoco.map((e) => e.preguntaNumero).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
