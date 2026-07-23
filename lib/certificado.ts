import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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

export async function generarCertificadoPDF(datos: DatosCertificado): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const pagina = doc.addPage([842, 595]); // A4 apaisado
  const { width, height } = pagina.getSize();

  const fuenteTitulo = await doc.embedFont(StandardFonts.HelveticaBold);
  const fuenteTexto = await doc.embedFont(StandardFonts.Helvetica);

  const azul = rgb(0.18, 0.53, 1);
  const dorado = rgb(1, 0.79, 0.24);
  const tinta = rgb(0.11, 0.16, 0.29);

  // marco decorativo
  pagina.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: dorado,
    borderWidth: 4,
  });
  pagina.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: azul,
    borderWidth: 1.5,
  });

  const centrarX = (texto: string, fuente: typeof fuenteTitulo, tam: number) =>
    (width - fuente.widthOfTextAtSize(texto, tam)) / 2;

  pagina.drawText("CERTIFICADO DE CATEQUESIS", {
    x: centrarX("CERTIFICADO DE CATEQUESIS", fuenteTitulo, 30),
    y: height - 110,
    size: 30,
    font: fuenteTitulo,
    color: azul,
  });

  pagina.drawText("Se otorga el presente reconocimiento a", {
    x: centrarX("Se otorga el presente reconocimiento a", fuenteTexto, 14),
    y: height - 170,
    size: 14,
    font: fuenteTexto,
    color: tinta,
  });

  pagina.drawText(datos.nombreAlumno, {
    x: centrarX(datos.nombreAlumno, fuenteTitulo, 26),
    y: height - 210,
    size: 26,
    font: fuenteTitulo,
    color: tinta,
  });

  const linea2 = `Por haber concluido satisfactoriamente el examen "${datos.nombreExamen}"`;
  pagina.drawText(linea2, {
    x: centrarX(linea2, fuenteTexto, 13),
    y: height - 250,
    size: 13,
    font: fuenteTexto,
    color: tinta,
  });

  const linea3 = `con una calificación de ${datos.calificacion}`;
  pagina.drawText(linea3, {
    x: centrarX(linea3, fuenteTexto, 13),
    y: height - 272,
    size: 13,
    font: fuenteTexto,
    color: tinta,
  });

  if (datos.catequista || datos.capilla) {
    const linea4 = [datos.catequista && `Catequista: ${datos.catequista}`, datos.capilla && `Capilla: ${datos.capilla}`]
      .filter(Boolean)
      .join("   ·   ");
    pagina.drawText(linea4, {
      x: centrarX(linea4, fuenteTexto, 11),
      y: height - 300,
      size: 11,
      font: fuenteTexto,
      color: tinta,
    });
  }

  const fechaTexto = datos.fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  pagina.drawText(fechaTexto, {
    x: 80,
    y: 80,
    size: 11,
    font: fuenteTexto,
    color: tinta,
  });

  pagina.drawText(`Folio: ${datos.folio}`, {
    x: 80,
    y: 62,
    size: 9,
    font: fuenteTexto,
    color: tinta,
  });

  // QR de validación
  const qrDataUrl = await QRCode.toDataURL(datos.urlValidacion, { margin: 0 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrImageBytes);
  const qrTam = 90;
  pagina.drawImage(qrImage, { x: width - 80 - qrTam, y: 55, width: qrTam, height: qrTam });

  return doc.save();
}
