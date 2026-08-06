import nodemailer from "nodemailer";

// Configuración vía variables de entorno (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
// Si no están configuradas, la función no falla: solo registra un aviso (para no romper el flujo del examen).
function crearTransporte() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function enviarCorreoResultado(params: {
  destinatario: string;
  nombreAlumno: string;
  examen: string;
  calificacion: number;
  aprobado: boolean;
  urlCertificado?: string;
}) {
  const transporte = crearTransporte();
  if (!transporte) {
    console.warn("SMTP no configurado: se omite el envío de correo.");
    return { enviado: false, motivo: "SMTP no configurado" };
  }

  const asunto = params.aprobado
    ? `¡${params.nombreAlumno} aprobó el examen "${params.examen}"!`
    : `Resultado del examen "${params.examen}"`;

  const cuerpo = `
    <p>Hola,</p>
    <p><strong>${params.nombreAlumno}</strong> obtuvo una calificación de <strong>${params.calificacion}</strong> en el examen "${params.examen}".</p>
    <p>Resultado: <strong>${params.aprobado ? "Aprobado ✅" : "No aprobado"}</strong></p>
    ${params.urlCertificado ? `<p><a href="${params.urlCertificado}">Descargar certificado</a></p>` : ""}
  `;

  await transporte.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: params.destinatario,
    subject: asunto,
    html: cuerpo,
  });

  return { enviado: true };
}
