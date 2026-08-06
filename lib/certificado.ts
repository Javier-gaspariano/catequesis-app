import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import QRCode from "qrcode";

interface DatosCertificado {
  nombreAlumno: string;
  nombreExamen: string;
  catequista?: string;
  capilla?: string;
  calificacion: number;
  fecha: Date;
  folio: string;
  urlValidacion: string;
}

export interface ConfigCertificado {
  titulo: string;
  textoPrincipal: string;
  textoSecundario: string;
  colorPrimario: string;
  colorAcento: string;
  colorTexto: string;
  fuente: string; // "Helvetica" | "TimesRoman" | "Courier"
  logoUrl?: string | null;
  firmaUrl?: string | null;
  selloUrl?: string | null;
}

export const CONFIG_CERTIFICADO_POR_DEFECTO: ConfigCertificado = {
  titulo: "CERTIFICADO DE CATEQUESIS",
  textoPrincipal: "Se otorga el presente reconocimiento a",
  textoSecundario:
    'Por haber concluido satisfactoriamente el examen "{examen}"\ncon una calificación de {calificacion}',
  colorPrimario: "#2E86FF",
  colorAcento: "#FFC93C",
  colorTexto: "#1B2A4A",
  fuente: "Helvetica",
};

function hexARgb(hex: string) {
  const limpio = hex.replace("#", "");
  const r = parseInt(limpio.substring(0, 2), 16) / 255;
  const g = parseInt(limpio.substring(2, 4), 16) / 255;
  const b = parseInt(limpio.substring(4, 6), 16) / 255;
  return rgb(r || 0, g || 0, b || 0);
}

function reemplazarPlaceholders(texto: string, datos: DatosCertificado) {
  return texto
    .replaceAll("{nombre}", datos.nombreAlumno)
    .replaceAll("{examen}", datos.nombreExamen)
    .replaceAll("{calificacion}", String(datos.calificacion))
    .replaceAll("{catequista}", datos.catequista ?? "")
    .replaceAll("{capilla}", datos.capilla ?? "")
    .replaceAll("{folio}", datos.folio);
}

function fuentesEstandar(nombre: string): { normal: StandardFonts; negrita: StandardFonts } {
  switch (nombre) {
    case "TimesRoman":
      return { normal: StandardFonts.TimesRoman, negrita: StandardFonts.TimesRomanBold };
    case "Courier":
      return { normal: StandardFonts.Courier, negrita: StandardFonts.CourierBold };
    default:
      return { normal: StandardFonts.Helvetica, negrita: StandardFonts.HelveticaBold };
  }
}

async function embebirImagenDesdeUrl(doc: PDFDocument, url: string) {
  try {
    const res = await fetch(url);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (url.toLowerCase().endsWith(".png")) return await doc.embedPng(bytes);
    return await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function generarCertificadoPDF(
  datos: DatosCertificado,
  config: ConfigCertificado = CONFIG_CERTIFICADO_POR_DEFECTO
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const pagina = doc.addPage([842, 595]); // A4 apaisado
  const { width, height } = pagina.getSize();

  const { normal, negrita } = fuentesEstandar(config.fuente);
  const fuenteTitulo = await doc.embedFont(negrita);
  const fuenteTexto = await doc.embedFont(normal);

  const colorPrimario = hexARgb(config.colorPrimario);
  const colorAcento = hexARgb(config.colorAcento);
  const colorTexto = hexARgb(config.colorTexto);

  // marco decorativo
  pagina.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: colorAcento,
    borderWidth: 4,
  });
  pagina.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: colorPrimario,
    borderWidth: 1.5,
  });

  const centrar = (texto: string, fuente: PDFFont, tam: number) => (width - fuente.widthOfTextAtSize(texto, tam)) / 2;

  let y = height - 90;

  if (config.logoUrl) {
    const logo = await embebirImagenDesdeUrl(doc, config.logoUrl);
    if (logo) {
      const tam = 70;
      pagina.drawImage(logo, { x: (width - tam) / 2, y: y - tam + 20, width: tam, height: tam });
      y -= tam + 10;
    }
  }

  pagina.drawText(config.titulo, {
    x: centrar(config.titulo, fuenteTitulo, 30),
    y,
    size: 30,
    font: fuenteTitulo,
    color: colorPrimario,
  });
  y -= 60;

  pagina.drawText(config.textoPrincipal, {
    x: centrar(config.textoPrincipal, fuenteTexto, 14),
    y,
    size: 14,
    font: fuenteTexto,
    color: colorTexto,
  });
  y -= 40;

  pagina.drawText(datos.nombreAlumno, {
    x: centrar(datos.nombreAlumno, fuenteTitulo, 26),
    y,
    size: 26,
    font: fuenteTitulo,
    color: colorTexto,
  });
  y -= 40;

  const textoSecundario = reemplazarPlaceholders(config.textoSecundario, datos);
  for (const linea of textoSecundario.split("\n")) {
    pagina.drawText(linea, {
      x: centrar(linea, fuenteTexto, 13),
      y,
      size: 13,
      font: fuenteTexto,
      color: colorTexto,
    });
    y -= 22;
  }

  if (datos.catequista || datos.capilla) {
    const lineaMeta = [datos.catequista && `Catequista: ${datos.catequista}`, datos.capilla && `Capilla: ${datos.capilla}`]
      .filter(Boolean)
      .join("   ·   ");
    pagina.drawText(lineaMeta, {
      x: centrar(lineaMeta, fuenteTexto, 11),
      y,
      size: 11,
      font: fuenteTexto,
      color: colorTexto,
    });
  }

  const fechaTexto = datos.fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  pagina.drawText(fechaTexto, { x: 80, y: 90, size: 11, font: fuenteTexto, color: colorTexto });
  pagina.drawText(`Folio: ${datos.folio}`, { x: 80, y: 72, size: 9, font: fuenteTexto, color: colorTexto });

  // firma y sello (opcionales), sobre la línea de fecha
  let xFirma = 250;
  if (config.firmaUrl) {
    const firma = await embebirImagenDesdeUrl(doc, config.firmaUrl);
    if (firma) {
      pagina.drawImage(firma, { x: xFirma, y: 65, width: 110, height: 50 });
      xFirma += 130;
    }
  }
  if (config.selloUrl) {
    const sello = await embebirImagenDesdeUrl(doc, config.selloUrl);
    if (sello) {
      pagina.drawImage(sello, { x: xFirma, y: 55, width: 70, height: 70 });
    }
  }

  // QR de validación
  const qrDataUrl = await QRCode.toDataURL(datos.urlValidacion, { margin: 0 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrImageBytes);
  const qrTam = 90;
  pagina.drawImage(qrImage, { x: width - 80 - qrTam, y: 55, width: qrTam, height: qrTam });

  return doc.save();
}
