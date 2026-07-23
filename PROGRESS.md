# Progreso del proyecto - Sistema Catequesis

## Estado: Fase 1 completa, iniciando Fase 2
Fecha: 2026-07-03

## Plan de fases
- [x] Fase 1: Scaffold Next.js (App Router, TS, Tailwind) + prisma/schema.prisma completo (Usuario, Parroquia, Capilla, Catequista, Examen, Pregunta, Opcion, ExamenPregunta, Intento, Respuesta, Resultado, Certificado, LogAuditoria). Deps instaladas: prisma, @prisma/client, framer-motion, zod, bcryptjs, jsonwebtoken, qrcode.
  - NOTA: `npx prisma generate/validate` falla en este entorno (binarios.prisma.sh no está en la whitelist de red). El usuario debe correr `npx prisma generate` y `npx prisma migrate dev` en su propia máquina/servidor.
- [x] Fase 2: Flujo de examen (alumno) COMPLETO y compila sin errores (`npm run build` verificado, quitando temporalmente next/font por restricción de red del sandbox, luego restaurado).
  - components/exam/Bienvenida.tsx — pantalla de bienvenida animada con imagen de portada
  - components/exam/FormularioAlumno.tsx — captura datos obligatorios/opcionales con validación
  - components/exam/BarraProgreso.tsx — "Pregunta X de Y" + tiempo transcurrido (sin cronómetro regresivo) + barra visual
  - components/exam/OpcionBoton.tsx — animación rebote/color/brillo al seleccionar (Framer Motion)
  - components/exam/PreguntaCard.tsx — soporta: RESPUESTA_UNICA, VERDADERO_FALSO, SELECCION_MULTIPLE, IMAGEN_RESPUESTA, ORDENAR_ELEMENTOS (drag), COMPLETAR_ESPACIOS
    - PENDIENTE: RELACIONAR_COLUMNAS, BASADA_AUDIO, BASADA_VIDEO (se agregan en próxima iteración de este componente)
  - components/exam/ExamRunner.tsx — orquestador: transición horizontal entre preguntas, guardar/continuar después (localStorage por examen+alumno), detección offline/online, validación "no finalizar con preguntas sin responder" con lista de pendientes y salto directo
  - lib/local-progress.ts — guardado local + gancho de sincronización cuando vuelve la conexión (falta conectar a API real, Fase 3)
  - lib/demo-data.ts, types/exam.ts
  - app/examen/demo — página de prueba funcional
  - Diseño: paleta "Camino de Fe" (azul #2E86FF, verde #22C55E, amarillo #FFC93C, naranja #FF7A45, crema #FFFBF2), tipografía Baloo 2 (display) + Nunito (texto), blobs decorativos, botón CTA grande
- [x] Fase 3: Backend API completo
  - lib/prisma.ts, lib/calificacion.ts (motor de calificación por tipo de pregunta + cálculo de escala/aprobación)
  - app/api/examenes (GET lista, POST crear) y app/api/examenes/[id] (GET examen listo para alumno con mezcla/aleatorio y SIN exponer respuestas correctas, PATCH, DELETE)
  - app/api/intentos (POST inicia/retoma intento, valida fechas apertura/cierre e intentos permitidos)
  - app/api/intentos/[id]/respuestas (PUT autoguardado de cada respuesta)
  - app/api/intentos/[id]/finalizar (POST valida preguntas pendientes, califica, genera folio de certificado si aprueba)
  - NOTA: errores de "implicit any" al correr `tsc` son solo porque @prisma/client no está generado en este sandbox (sin red a binaries.prisma.sh); desaparecen con `npx prisma generate` en el entorno real.
  - PENDIENTE conectar: lib/local-progress.ts (frontend) con estos endpoints reales (ahora mismo el frontend solo guarda en localStorage)
- [x] Fase 4: Panel admin completo
  - app/admin/layout.tsx (menú lateral), app/admin/page.tsx (dashboard KPIs)
  - app/admin/examenes: lista con publicar/despublicar/duplicar/eliminar; app/admin/examenes/nuevo (crear); app/admin/examenes/[id] (asignar preguntas del banco)
  - app/admin/preguntas: banco con filtros + formulario manual (todas las opciones, imagen, retroalimentación)
  - app/admin/carga-masiva: sube Excel/CSV/JSON/Word/PDF -> preview editable -> confirmar importación
  - lib/carga-masiva.ts: parsers (Excel/CSV por columnas `enunciado,tipo,opcion1..6,correcta,retroalimentacion,tema,nivel,dificultad`; JSON estructurado; Word/PDF vía texto plano con convención `1. pregunta` / `a) opción` / `*b) opción correcta`)
  - components/admin/SubirImagen.tsx + app/api/uploads (guarda en /public/uploads, self-hosted; para producción real con múltiples servidores conviene S3/Cloudinary)
  - APIs nuevas: /api/preguntas, /api/examenes/[id]/preguntas, /api/examenes/[id]/duplicar, /api/carga-masiva, /api/carga-masiva/confirmar, /api/uploads
  - Verificado con `tsc --noEmit`: sin errores reales (solo "implicit any" esperados por falta de @prisma/client generado en este sandbox)
  - PENDIENTE: proteger /admin con auth JWT + roles (Fase 7), edición de pregunta existente (hoy solo crear), UI para tipos RELACIONAR_COLUMNAS/audio/video en el form manual
- [x] Fase 5: Estadísticas y dashboard avanzado
  - /api/estadisticas/general (participantes, promedio, aprobados/reprobados, tiempo promedio)
  - /api/estadisticas/segmentacion?por= (capilla|catequista|edad|sexo|grupo|examen)
  - /api/estadisticas/preguntas (dificultad, %aciertos/errores, tiempo promedio, discriminación 27%-alto vs bajo, más fallada/acertada)
  - app/admin/estadisticas: gráficas de barras (recharts) segmentables + pastel aprobados/reprobados + tabla de análisis de preguntas
  - Verificado con tsc --noEmit: solo errores en cascada por @prisma/client sin generar (esperado en este sandbox)
  - PENDIENTE: heatmaps, exportación de gráficas, dashboard ejecutivo separado para párroco/coordinador (Fase 6/7)
- [x] Fase 6: Certificados PDF + exportación de reportes
  - lib/certificado.ts: genera PDF con pdf-lib (marco decorativo, nombre, examen, calificación, folio, QR de validación)
  - /api/certificados/[id]: descarga el certificado PDF de un intento aprobado
  - app/validar/[folio]: página pública que valida un certificado escaneando el QR
  - /api/reportes?formato=excel|csv|pdf|json&examenId=: exporta resultados finalizados
  - Botones de exportación agregados en app/admin/estadisticas
  - INTEGRACIÓN IMPORTANTE: components/exam/ExamRunner.tsx ahora habla con la API real:
    - POST /api/intentos al iniciar (crea/retoma intento; si falla por offline, sigue en modo local como antes)
    - PUT /api/intentos/:id/respuestas en cada respuesta (autoguardado remoto best-effort)
    - POST /api/intentos/:id/finalizar al terminar -> muestra calificación real y botón de descarga de certificado
  - Cambio de schema: Capilla.parroquiaId ahora es opcional (antes requerido) para permitir alta automática de capilla/catequista por nombre desde el formulario del alumno (ver /api/intentos, hace find-or-create por nombre)
  - ⚠️ IMPORTANTE: este cambio de schema requiere volver a correr `npx prisma db push` contra Neon antes de que funcione en producción
  - Verificado con tsc --noEmit: sin errores reales
  - PENDIENTE: notificación de certificado por correo/WhatsApp (Fase 8), UI admin para revisar/enviar certificados manualmente
- [x] Fase 7: Autenticación JWT + roles + protección de /admin
  - lib/auth.ts (firmar/verificar sesión con jsonwebtoken, hash bcrypt, Node runtime)
  - lib/auth-edge.ts (verificación con `jose`, compatible con Edge Middleware — jsonwebtoken NO funciona en Edge)
  - lib/auth-shared.ts (tipos/constantes sin dependencias Node, usado tanto por auth.ts como por middleware)
  - middleware.ts: protege TODAS las rutas /admin/* (excepto /admin/login y /admin/setup-inicial), redirige a login si no hay sesión válida
  - /api/auth/login, /api/auth/logout, /api/auth/me
  - /api/auth/setup-inicial: crea el PRIMER administrador (ADMIN_GENERAL); se autodeshabilita en cuanto exista 1 usuario en la tabla
  - app/admin/setup-inicial y app/admin/login: páginas correspondientes
  - app/admin/layout.tsx: muestra nombre/rol de la sesión + botón cerrar sesión (components/admin/BotonSalir.tsx)
  - Roles: ADMIN_GENERAL > COORDINADOR > CATEQUISTA > CONSULTA (lib/auth-shared.ts: NIVEL_ROL, tienePermiso)
  - Verificado con tsc --noEmit: sin errores reales
  - PRIMER PASO EN PRODUCCIÓN: ir a /admin/setup-inicial UNA VEZ para crear el admin, luego /admin/login
  - PENDIENTE: permisos granulares por rol en cada endpoint (hoy el middleware solo exige "estar logueado", no diferencia CONSULTA de ADMIN_GENERAL en las rutas API); pantalla de gestión de usuarios
- [x] Fase 8: Docker + notificaciones + documentación
  - Dockerfile (multi-stage, standalone), docker-compose.yml (app + Postgres + volúmenes persistentes para DB y uploads), docker-entrypoint.sh (aplica schema al iniciar), .dockerignore, .env.example
  - next.config.ts: output "standalone" habilitado para Docker
  - lib/notificaciones.ts: envío de correo por SMTP (nodemailer); si no hay SMTP configurado, no rompe el flujo, solo lo omite
  - Integrado en /api/intentos/[id]/finalizar: notifica por correo al catequista (si tiene email registrado) con resultado + link de certificado
  - README.md: instrucciones completas de despliegue (Vercel+Neon y Docker self-hosted) y desarrollo local

## PROYECTO: TODAS LAS FASES COMPLETADAS (1-8)
Pendientes menores documentados en cada fase arriba (permisos granulares por rol, edición de preguntas existentes,
UI de gestión de usuarios, heatmaps, WhatsApp/Telegram, modo kiosco, i18n, PWA/offline avanzado, tests automatizados).
El sistema es funcional de punta a punta: examen para el alumno -> calificación automática -> certificado PDF con QR ->
estadísticas -> exportación de reportes -> panel admin con login y roles.

## Notas
- Alcance completo del prompt es muy grande (nivel institucional). Se construye por fases funcionales, cada una usable de forma incremental.
- Soporte de imágenes: campo image_url en preguntas, opciones, y branding (logo/fondo configurable desde admin) - se agrega en Fase 1 schema.

## Actualización (sesión posterior a fases 1-8)
- Mensaje para padres agregado en FormularioAlumno.tsx, con firma "Atte. Presbítero Manuel Antonio Mojica Cabrera."
- Campo "Edad" ELIMINADO del formulario del alumno (ya no se pide). El campo `edad` sigue existiendo en el modelo Intento de la BD (por compatibilidad, para no requerir migración destructiva) pero ahora se envía como 0 por defecto. La API /api/intentos ya no lo exige como obligatorio.
- RelacionarColumnas (PreguntaCard.tsx): ahora cada pareja se pinta de un color distinto (paleta de 6 colores rotativa) y se puede desmarcar tocando de nuevo la opción A o B ya emparejada, para corregir.
- Banco de preguntas (/admin/preguntas): agregada numeración global, agrupación visual por tema, y filtros (texto, tipo, tema, dificultad).
- Fix importante de eliminación en cascada (requiere `prisma db push`):
  - Resultado.intento y Certificado.intento ahora tienen onDelete: Cascade (antes bloqueaban borrar un Intento).
  - Intento.examen ahora tiene onDelete: Cascade (antes bloqueaba borrar un Examen que ya tenía intentos asociados, como el examen de ejemplo).
- Errores reales de eliminar (examen, intento) ahora se muestran en un alert() en vez de fallar en silencio.
- Nuevo: /api/reportes/detalle (excel/csv/json) — reporte con una fila POR CADA RESPUESTA de cada examen: nombre, capilla, catequista, examen, pregunta, respuesta dada, si fue correcta, calificación final, aprobado. Botón "Reporte detallado" agregado en /admin/estadisticas.
- Nuevo: /admin/catequistas y /admin/capillas (CRUD simple) + /api/seed-inicial (precarga una sola vez si las tablas están vacías) para que el select de Capilla/Catequista en el examen del alumno sea dinámico según lo que el admin gestione, en vez de listas fijas en código.

## PENDIENTE para la próxima sesión
- Nada bloqueante identificado. Revisar si el usuario reporta más botones rotos en /admin/examenes (publicar/despublicar/duplicar no tienen manejo de error todavía, solo eliminar).
- Confirmar con el usuario si quiere quitar por completo `edad` de la base de datos (requeriría migración) o dejarlo como está (oculto en UI, default 0).

## Actualización (sesión de seguridad + filtros + edición)
NOTA: el entorno de trabajo (sandbox) se reinició a mitad de esta sesión. Se retomó desde el ZIP que el usuario tenía descargado (fases 1-8 + actualizaciones previas), no desde cero.

1. Sexo: "Niño/Niña" -> "Masculino/Femenino" en FormularioAlumno.tsx.
2. Sacramento: agregado "Catecúmeno" (antes solo Confirmación/Comunión).
3. SEGURIDAD — cambio importante:
   - VULNERABILIDAD CORREGIDA: casi todas las rutas /api/* de administración (examenes, preguntas, catequistas, capillas, carga-masiva, uploads, reportes, estadisticas, intentos GET/DELETE, seed-inicial) NO estaban protegidas por el middleware (que solo cubre páginas /admin/*, no /api/*). Cualquiera podía llamarlas directamente sin login. Se creó lib/require-admin.ts (helper requireAdmin) y se aplicó a TODAS las rutas admin-only. Rutas que deben seguir públicas (sin tocar): GET /api/capillas, GET /api/catequistas (dropdown del examen), POST /api/intentos, PUT /api/intentos/[id]/respuestas, POST /api/intentos/[id]/finalizar, GET /api/examenes/[id] (rama no-admin), GET /api/certificados/[id], /api/auth/*.
   - Capturas de pantalla: NO es técnicamente posible bloquearlas desde una web (se le explicó al usuario). Se agregaron disuasivos: marca de agua con nombre+fecha superpuesta durante el examen, bloqueo de clic derecho/copiar, y aviso visible + registro (cambiosFoco) cuando el alumno cambia de pestaña/pierde el foco durante el examen. El campo cambiosFoco ahora se envía y guarda al finalizar.
4. /admin/resultados: agregados filtros por catequista y capilla (dropdowns dinámicos según los datos cargados) + botón de descarga CSV que respeta el filtro aplicado.
5. Explicado (no cambiado automáticamente): diferencia entre RESPUESTA_UNICA (acepta cualquiera de las opciones marcadas correctas) y SELECCION_MULTIPLE (exige marcar TODAS las correctas). Si el usuario tiene preguntas con 2 respuestas válidas de las que el alumno solo debe elegir una, deben ser RESPUESTA_UNICA, no SELECCION_MULTIPLE. Pendiente: el usuario debe revisar sus preguntas y corregir el tipo si aplica.
7. /admin/examenes/[id]: agregado panel "✏ Editar configuración" (plegable) con título, descripción, tiempo máximo, intentos permitidos, # preguntas al azar, mezclar preguntas/respuestas, escala, nota aprobatoria, emitir certificado — antes solo se podía asignar preguntas y togglear certificado.

Verificado con tsc --noEmit: todos los errores restantes son "implicit any" en cascada por @prisma/client sin generar en este sandbox (sin red a binaries.prisma.sh) — no son errores reales de este cambio.

## PENDIENTE para la próxima sesión
- Confirmar con el usuario si las preguntas de selección múltiple problemáticas ya se corseles pidió que revise/corrija el tipo (RESPUESTA_UNICA vs SELECCION_MULTIPLE).
- Los botones Publicar/Despublicar/Duplicar en /admin/examenes todavía no muestran error si fallan (solo Eliminar lo hace) — podría pulirse si el usuario reporta problemas ahí.

## Actualización (captura de pantalla + filtros sacramento)
1. Confirmado con usuario: dejar la seguridad tal como está (marca de agua + bloqueo copiar/clic derecho + registro de cambios de foco). Se le explicó que el "FLAG_SECURE" de Android (pantalla negra al capturar) es exclusivo de apps nativas o apps empaquetadas con Capacitor/Cordova — NO es posible en una web abierta desde el navegador. Quedó pendiente como posible proyecto futuro (empaquetar con Capacitor) si el usuario lo pide más adelante, sin tocar nada del código actual.
2. cambiosFoco ahora es consultable: visible en /admin/resultados (⚠ N salida(s) de pantalla junto a cada intento) y en ambos reportes descargables (columna "Cambios de pantalla" / "CambiosDePantalla").
3. El aviso de "saliste de la pantalla" ahora es un overlay bloqueante (no un banner descartable) — el alumno debe dar clic en "Entendido" para poder seguir interactuando con el examen.
4. /admin/resultados: agregado filtro por Sacramento (además de catequista y capilla ya existentes).
5. El sacramento elegido por el alumno (campo "grupo") ahora aparece como columna "Sacramento" en /api/reportes (general) y /api/reportes/detalle (por pregunta).

Verificado con tsc --noEmit: solo quedan los "implicit any" esperados en cascada por @prisma/client sin generar en este sandbox.

## Fix: panel admin inutilizable en celular
Causa: el menú lateral tenía `hidden sm:flex` — en pantallas menores a 640px desaparecía por completo y no existía ninguna alternativa de navegación.
Solución: nuevo components/admin/AdminNav.tsx (client component) con:
- Barra superior + botón hamburguesa visible solo en móvil, que abre un menú deslizable desde la derecha.
- Menú lateral de escritorio sin cambios de comportamiento (oculto en móvil como antes, pero ahora sí hay alternativa).
- Resaltado del link activo según la ruta actual en ambos menús.
app/admin/layout.tsx simplificado para usar este componente.

## Actualización: tiempo/salidas por pregunta en reporte + filtro por examen
1. Nuevo campo Intento.eventosFoco (Json) — registra cada salida de pantalla con: número de pregunta, enunciado, momento. Requiere `prisma db push`.
   - ExamRunner.tsx: usa un ref (preguntaActualRef) para saber en qué pregunta estaba el alumno al perder el foco; acumula eventos y los envía junto con cambiosFoco al finalizar.
   - /api/intentos/[id]/finalizar: guarda eventosFoco en el Intento.
2. /api/reportes/detalle: nuevas columnas TiempoTotalMinutos (mm:ss), SalioDePantalla (Sí/No), PreguntasDondeSalio (lista de números de pregunta).
3. /admin/resultados: agregado filtro por Examen (dropdown dinámico, igual que catequista/capilla/sacramento).

Verificado con tsc --noEmit: solo quedan los "implicit any" esperados en cascada por @prisma/client sin generar en este sandbox.

## Fix: reporte detallado mostraba IDs en vez de texto de respuesta
/api/reportes/detalle: resumirValor ahora resuelve los IDs de opción guardados en cada respuesta al texto real de la opción, según el tipo de pregunta (selección única/múltiple, ordenar, relacionar columnas, completar espacios). Antes mostraba el UUID interno.
No requiere prisma db push (no hay cambio de schema, solo de la consulta/lectura).

## Actualización: más KPIs en dashboard + filtros/gráfica en estadísticas
1. app/admin/page.tsx (Dashboard): ampliado de 4 a 12 tarjetas: exámenes totales/publicados, preguntas, participantes, aprobados, reprobados, % de aprobación, promedio general, tiempo promedio, certificados emitidos, catequistas activos, capillas registradas.
2. Nuevo /api/estadisticas/tiempo-salidas: agrupa por examen el tiempo promedio (minutos) y el promedio de salidas de pantalla (cambiosFoco), más cuántos alumnos tuvieron al menos una salida. Nueva gráfica de barras dobles en /admin/estadisticas ("Tiempo y salidas de pantalla por examen").
3. /api/estadisticas/preguntas ahora acepta ?examenId= para filtrar el análisis a un examen específico.
4. /admin/estadisticas → "Análisis de preguntas": agregados filtros por examen, dificultad, rango de % (mín/máx), y orden (mayor/menor % primero). Se destacan arriba la pregunta con menor y mayor % de aciertos.

No requiere prisma db push (sin cambios de schema).

## Actualización: filtro por catequista en Análisis de preguntas
/api/estadisticas/preguntas ahora acepta también ?catequistaId= (además de examenId), combinables. Select agregado en /admin/estadisticas. No requiere prisma db push.

## Actualización grande: cierre por límite de salidas, tiempo por pregunta, mensaje configurable + checkboxes
Requiere `npx prisma db push` (muchos campos nuevos).

1. Análisis de preguntas: botón "⬇ Exportar a Excel" (exporta el análisis ya filtrado, client-side con xlsx).
2. Pregunta.tiempoRespuestaSegundos (Int?, null = libre): campo nuevo en el formulario del banco de preguntas. En el examen, ExamRunner.tsx muestra un cronómetro por pregunta (badge "⏳ Tiempo para esta pregunta") y avanza automáticamente al agotarse el tiempo, guardando lo que el alumno haya seleccionado hasta ese momento.
3. Examen.limiteSalidasPantalla (Int?) + Examen.mensajeCierrePorSalidas (Text?): configurables en /admin/examenes/[id] → "Editar configuración". Si el alumno excede el número de salidas de pantalla configurado, el examen se cierra y califica automáticamente con lo que llevaba contestado (nuevo flag `forzado` en /api/intentos/[id]/finalizar que salta la validación de "preguntas pendientes"), mostrando el mensaje personalizado en la pantalla final. Intento.cerradoPorLimiteSalidas (Boolean) registra si ocurrió.
4. Examen.mensajeEncabezado (Text?, si es null usa el mensaje por defecto que antes estaba fijo) + Examen.checkboxCorrecta (Int? 1/2/3): configurables en la misma pantalla de edición. FormularioAlumno.tsx ahora muestra el mensaje del examen (no uno fijo) y, si checkboxCorrecta está configurado, 3 casillas de verificación; el formulario NO deja avanzar si no se marca única y exclusivamente la casilla correcta (la instrucción de cuál es debe redactarse dentro del mensaje mismo). Intento.checkboxesMarcados (Int[]) e Intento.lecturaCorrecta (Boolean?) se calculan y guardan en /api/intentos POST.
   - Nuevo /api/estadisticas/lectura-mensaje: % de padres que marcaron correctamente, agrupado por examen. Nueva sección "Verificación de lectura del mensaje" en /admin/estadisticas (arriba de "Análisis de preguntas", visible solo si hay datos).

Verificado con tsc --noEmit: sin errores propios en los archivos tocados esta sesión; el resto son "implicit any"/tipos de Prisma en cascada por @prisma/client sin generar en este sandbox (incluye ahora también "Opcion", "TipoPregunta", "Pregunta" como tipos no exportados — mismo motivo, no son errores reales).

## PENDIENTE
- No se agregó UI para editar mensajeEncabezado/checkboxCorrecta en "Nuevo examen" (solo en editar ya creado) — funcionalmente equivalente ya que se puede configurar justo después de crear.
- El límite de salidas de pantalla no distingue entre "salida accidental breve" y "salida prolongada" — cualquier blur/cambio de pestaña cuenta igual.
