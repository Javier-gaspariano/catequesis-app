"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Examen, DatosAlumno, ValorRespuesta, EstadoExamenLocal } from "@/types/exam";
import Bienvenida from "./Bienvenida";
import FormularioAlumno from "./FormularioAlumno";
import BarraProgreso from "./BarraProgreso";
import PreguntaCard from "./PreguntaCard";
import { guardarProgreso, cargarProgreso } from "@/lib/local-progress";

type Fase = "bienvenida" | "formulario" | "preguntas" | "finalizado";

function haySeleccion(v: ValorRespuesta) {
  if (v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return v !== "";
}

function formatearTiempo(segundos: number) {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function ExamRunner({ examen }: { examen: Examen }) {
  const [fase, setFase] = useState<Fase>("bienvenida");
  const [datosAlumno, setDatosAlumno] = useState<DatosAlumno | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, ValorRespuesta>>({});
  const [indice, setIndice] = useState(0);
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [iniciadoEn, setIniciadoEn] = useState<number>(Date.now());
  const [segundos, setSegundos] = useState(0);
  const [avisoPendientes, setAvisoPendientes] = useState<number[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [cambiosFoco, setCambiosFoco] = useState(0);
  const [eventosFoco, setEventosFoco] = useState<
    { preguntaNumero: number; preguntaEnunciado: string; momento: string }[]
  >([]);
  const [avisoFoco, setAvisoFoco] = useState(false);
  const [intentoId, setIntentoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [certificadoUrl, setCertificadoUrl] = useState<string | null>(null);
  const [resultadoFinal, setResultadoFinal] = useState<{ calificacion: number; aprobado: boolean } | null>(
    null
  );
  const [cerradoPorLimite, setCerradoPorLimite] = useState(false);
  const [tiempoPregunta, setTiempoPregunta] = useState<number | null>(null);

  const preguntas = examen.preguntas;
  const preguntaActual = preguntas[indice];
  const preguntaActualRef = useRef({ indice, preguntaActual });
  useEffect(() => {
    preguntaActualRef.current = { indice, preguntaActual };
  }, [indice, preguntaActual]);

  // reloj
  useEffect(() => {
    if (fase !== "preguntas") return;
    const t = setInterval(() => setSegundos(Math.floor((Date.now() - iniciadoEn) / 1000)), 1000);
    return () => clearInterval(t);
  }, [fase, iniciadoEn]);

  // detectar conexión (para guardado local / sincronización)
  useEffect(() => {
    const actualizar = () => setOffline(!navigator.onLine);
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  const cambiosFocoRef = useRef(0);

  // deterrentes básicos durante el examen: bloquear clic derecho/copiar y detectar cambio de pestaña
  // (nota: esto NO impide capturas de pantalla, técnicamente imposible desde una web; ver marca de agua)
  useEffect(() => {
    if (fase !== "preguntas") return;
    const bloquearMenu = (e: MouseEvent) => e.preventDefault();
    const bloquearCopiar = (e: ClipboardEvent) => e.preventDefault();
    const alPerderFoco = () => {
      cambiosFocoRef.current += 1;
      setCambiosFoco(cambiosFocoRef.current);
      setAvisoFoco(true);
      const { indice: i, preguntaActual: p } = preguntaActualRef.current;
      setEventosFoco((prev) => [
        ...prev,
        { preguntaNumero: i + 1, preguntaEnunciado: p?.enunciado ?? "", momento: new Date().toISOString() },
      ]);
      if (examen.limiteSalidasPantalla && cambiosFocoRef.current >= examen.limiteSalidasPantalla) {
        setCerradoPorLimite(true);
        finalizarEnServidor(true);
      }
    };
    document.addEventListener("contextmenu", bloquearMenu);
    document.addEventListener("copy", bloquearCopiar);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) alPerderFoco();
    });
    window.addEventListener("blur", alPerderFoco);
    return () => {
      document.removeEventListener("contextmenu", bloquearMenu);
      document.removeEventListener("copy", bloquearCopiar);
      window.removeEventListener("blur", alPerderFoco);
    };
  }, [fase]);

  // autoguardado local en cada cambio relevante
  useEffect(() => {
    if (!datosAlumno) return;
    const estado: EstadoExamenLocal = {
      examenId: examen.id,
      datosAlumno,
      respuestas,
      preguntaActual: indice,
      iniciadoEn,
      ordenPreguntas: preguntas.map((p) => p.id),
    };
    guardarProgreso(estado);
  }, [datosAlumno, respuestas, indice, iniciadoEn, examen.id, preguntas]);

  // temporizador por pregunta (si la pregunta tiene tiempoRespuestaSegundos configurado)
  useEffect(() => {
    if (fase !== "preguntas") return;
    const limite = preguntaActual?.tiempoRespuestaSegundos;
    if (!limite) {
      setTiempoPregunta(null);
      return;
    }
    setTiempoPregunta(limite);
    const t = setInterval(() => {
      setTiempoPregunta((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(t);
          siguiente();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, indice]);

  const iniciarConDatos = useCallback(
    async (datos: DatosAlumno, checkboxesMarcados: number[]) => {
      const previo = cargarProgreso(examen.id, datos.nombreCompleto);
      if (previo && previo.examenId === examen.id) {
        setRespuestas(previo.respuestas);
        setIndice(previo.preguntaActual);
        setIniciadoEn(previo.iniciadoEn);
      } else {
        setIniciadoEn(Date.now());
      }
      setDatosAlumno(datos);
      setFase("preguntas");

      // intenta registrar el intento en el servidor (si falla, sigue en modo local/offline)
      try {
        const res = await fetch("/api/intentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examenId: examen.id, ...datos, checkboxesMarcados }),
        });
        if (res.ok) {
          const intento = await res.json();
          setIntentoId(intento.id);
        }
      } catch {
        // sin conexión: se sigue trabajando localmente
      }
    },
    [examen.id]
  );

  function irA(nuevoIndice: number) {
    setDireccion(nuevoIndice > indice ? 1 : -1);
    setIndice(nuevoIndice);
    setAvisoPendientes(null);
  }

  function siguiente() {
    if (indice < preguntas.length - 1) irA(indice + 1);
    else intentarFinalizar();
  }

  function anterior() {
    if (indice > 0) irA(indice - 1);
  }

  // autoguardado en el servidor por pregunta respondida (best-effort, no bloquea la UI)
  function guardarRespuestaRemota(preguntaId: string, valor: ValorRespuesta) {
    if (!intentoId) return;
    fetch(`/api/intentos/${intentoId}/respuestas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preguntaId, valor }),
    }).catch(() => {
      /* offline: la respuesta ya quedó en localStorage vía guardarProgreso */
    });
  }

  function intentarFinalizar() {
    const pendientes = preguntas
      .map((p, i) => (haySeleccion(respuestas[p.id]) ? -1 : i))
      .filter((i) => i !== -1);
    if (pendientes.length > 0) {
      setAvisoPendientes(pendientes);
      return;
    }
    finalizarEnServidor();
  }

  async function finalizarEnServidor(forzado = false) {
    if (!intentoId) {
      // sin conexión desde el inicio: se guarda todo local y se marca como pendiente de sincronizar
      setFase("finalizado");
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch(`/api/intentos/${intentoId}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cambiosFoco: cambiosFocoRef.current, eventosFoco, forzado }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.preguntasPendientes && !forzado) {
          const indices = data.preguntasPendientes
            .map((pid: string) => preguntas.findIndex((p) => p.id === pid))
            .filter((i: number) => i !== -1);
          setAvisoPendientes(indices);
        } else if (!forzado) {
          setErrorEnvio(data.error ?? "No se pudo enviar el examen.");
        }
        setEnviando(false);
        return;
      }
      setResultadoFinal(data.resultado);
      if (data.certificado) setCertificadoUrl(`/api/certificados/${intentoId}`);
      setFase("finalizado");
    } catch {
      if (!forzado) {
        setErrorEnvio("Sin conexión. Tus respuestas están guardadas localmente; reintenta cuando vuelva internet.");
      }
    }
    setEnviando(false);
  }

  const respondidas = useMemo(
    () => preguntas.filter((p) => haySeleccion(respuestas[p.id])).length,
    [preguntas, respuestas]
  );

  if (fase === "bienvenida") {
    return <Bienvenida examen={examen} onComenzar={() => setFase("formulario")} />;
  }

  if (fase === "formulario") {
    return <FormularioAlumno examen={examen} onListo={iniciarConDatos} />;
  }

  if (fase === "finalizado") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="mb-4 text-6xl"
        >
          🎉
        </motion.div>
        <h1 className="font-display text-3xl font-extrabold text-tinta">
          {cerradoPorLimite ? "Examen cerrado" : "¡Examen enviado!"}
        </h1>
        {cerradoPorLimite ? (
          <p className="mt-2 max-w-md whitespace-pre-line text-tinta-suave">
            {examen.mensajeCierrePorSalidas ??
              "El examen se cerró automáticamente por exceder el número permitido de salidas de la pantalla."}
          </p>
        ) : (
          <p className="mt-2 max-w-md text-tinta-suave">
            Gracias, {datosAlumno?.nombreCompleto?.split(" ")[0]}. Tu catequista revisará tus
            resultados muy pronto.
          </p>
        )}
        {resultadoFinal && (
          <div className="mt-4 rounded-2xl bg-white px-6 py-4 shadow-sm">
            <p className="font-display text-2xl font-extrabold text-tinta">
              {resultadoFinal.calificacion}
            </p>
            <p className={`text-sm font-bold ${resultadoFinal.aprobado ? "text-hoja" : "text-girasol"}`}>
              {resultadoFinal.aprobado ? "¡Aprobado! 🎉" : "No aprobado"}
            </p>
          </div>
        )}
        {certificadoUrl && (
          <a
            href={certificadoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 rounded-full bg-hoja px-8 py-3 font-display font-extrabold text-white shadow-md hover:opacity-90"
          >
            📄 Descargar certificado
          </a>
        )}
        {errorEnvio && (
          <p className="mt-4 max-w-sm rounded-2xl bg-girasol/10 px-4 py-3 text-sm font-semibold text-girasol">
            {errorEnvio}
          </p>
        )}
        {offline && !errorEnvio && (
          <p className="mt-4 rounded-full bg-sol/20 px-4 py-2 text-sm font-semibold text-tinta">
            Guardado sin conexión — se enviará automáticamente cuando vuelva internet.
          </p>
        )}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => window.close()}
          className="mt-8 rounded-full bg-tinta px-10 py-3 font-display font-extrabold text-white shadow-md hover:opacity-90"
        >
          Terminar
        </motion.button>
        <p className="mt-2 text-xs text-tinta-suave">Ya puedes cerrar esta pantalla.</p>
      </motion.div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] select-none flex-col">
      {/* marca de agua discreta: disuade compartir capturas (no las bloquea, técnicamente imposible) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.06]"
        aria-hidden
      >
        <div className="flex h-full w-full rotate-[-25deg] flex-wrap content-center justify-center gap-10 text-sm font-bold text-tinta">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i}>
              {datosAlumno?.nombreCompleto} · {new Date().toLocaleDateString("es-MX")}
            </span>
          ))}
        </div>
      </div>

      {avisoFoco && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/80 px-6 backdrop-blur-sm">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="mb-2 text-3xl">⚠️</p>
            <p className="mb-4 font-display font-bold text-tinta">
              Saliste de la pantalla del examen. Este evento queda registrado.
            </p>
            <button
              onClick={() => setAvisoFoco(false)}
              className="rounded-full bg-girasol px-8 py-3 font-display font-extrabold text-white hover:opacity-90"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        <BarraProgreso actual={indice} total={preguntas.length} tiempoTranscurrido={formatearTiempo(segundos)} />

        {tiempoPregunta !== null && (
          <div className="mx-auto mt-1 flex items-center gap-2 rounded-full bg-girasol/15 px-4 py-1 text-xs font-bold text-girasol">
            ⏳ Tiempo para esta pregunta: {formatearTiempo(tiempoPregunta)}
          </div>
        )}

        {offline && (
          <div className="mx-auto mt-2 rounded-full bg-sol/20 px-4 py-1 text-xs font-bold text-tinta">
            📶 Sin conexión — guardando localmente
          </div>
        )}

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direccion}>
            <motion.div
              key={preguntaActual.id}
              custom={direccion}
              initial={{ x: direccion === 1 ? 80 : -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direccion === 1 ? -80 : 80, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <PreguntaCard
                pregunta={preguntaActual}
                valor={respuestas[preguntaActual.id]}
                onCambiar={(v) => {
                  setRespuestas((r) => ({ ...r, [preguntaActual.id]: v }));
                  guardarRespuestaRemota(preguntaActual.id, v);
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {avisoPendientes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mb-3 rounded-2xl border-2 border-girasol/40 bg-girasol/10 px-4 py-3 text-sm text-tinta"
          >
            <p className="font-bold">Todavía existen preguntas sin responder.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {avisoPendientes.map((i) => (
                <button
                  key={i}
                  onClick={() => irA(i)}
                  className="rounded-full bg-white px-3 py-1 font-semibold text-girasol shadow-sm"
                >
                  Ir a la pregunta {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 pb-8">
          <button
            onClick={anterior}
            disabled={indice === 0}
            className="rounded-full px-6 py-3 font-display font-bold text-tinta-suave disabled:opacity-30"
          >
            ← Atrás
          </button>
          <span className="text-xs font-semibold text-tinta-suave">
            {respondidas}/{preguntas.length} respondidas
          </span>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={siguiente}
            disabled={enviando}
            className="rounded-full bg-cielo px-8 py-3 font-display font-extrabold text-white shadow-md shadow-cielo/30 hover:bg-cielo-oscuro disabled:opacity-60"
          >
            {enviando ? "Enviando..." : indice === preguntas.length - 1 ? "Finalizar ✓" : "Siguiente →"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
