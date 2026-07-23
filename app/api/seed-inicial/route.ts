import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const CAPILLAS = [
  "El Sagrado Corazón de Jesús (Col 16 de febrero)",
  "El Señor de la Misericordia (Col. Rodriguez Huerta)",
  "La Santa Cruz (Sentimientos)",
  "SEDE San Felipe de Jesús (Dos Lomas)",
  "San Agustín de Hipona (Dorado Real)",
  "San Antonio De Padua (El Cedral)",
  "San Antonio de Padua (La Loma Col. Valente Diaz)",
  "San Carlos Borromeo",
  "San Juan Bautista (Col. Unidad Antorchista)",
  "San Judas Tadeo (Col. Antonio Luna)",
  "San Pedro y San Pablo (Fracc. Geo Villas del Sol)",
];

const CATEQUISTAS = [
  "Adriana Hernández Ramos",
  "Juana Hernández Guzmán",
  "Neri Cruz Aca",
  "Agustina Zapot Mazaba",
  "Martha Laura Campo",
  "Fco. Javier Gaspariano Rguez.",
  "Iliana de Jesús Hernández Máfara",
  "Ivan David Moreno Martinez",
  "María Eugenia Martínez Murguía",
  "Maria Ines Martinez Murguia",
  "Miguel Chacha Chavarría",
  "Ana Maria García R.",
  "Miriam Seinez Reyez",
  "Brenda García Espíritu",
  "Facunda Román Pérez",
  "Rosalía Rodríguez Ruiz",
  "Ana María Santos Suárez",
  "Juana Sosa barradas",
  "Juliana Zarrabal Martinez",
];

// POST /api/seed-inicial -> crea las capillas/catequistas iniciales SOLO si las tablas están vacías.
// Después de usarla una vez, esta ruta ya no hace nada (no duplica).
export async function POST(req: NextRequest) {
  const bloqueo = requireAdmin(req);
  if (bloqueo) return bloqueo;
  const [totalCapillas, totalCatequistas] = await Promise.all([
    prisma.capilla.count(),
    prisma.catequista.count(),
  ]);

  let capillasCreadas = 0;
  let catequistasCreadas = 0;

  if (totalCapillas === 0) {
    const r = await prisma.capilla.createMany({ data: CAPILLAS.map((nombre) => ({ nombre })) });
    capillasCreadas = r.count;
  }
  if (totalCatequistas === 0) {
    const r = await prisma.catequista.createMany({ data: CATEQUISTAS.map((nombre) => ({ nombre })) });
    catequistasCreadas = r.count;
  }

  return NextResponse.json({ capillasCreadas, catequistasCreadas });
}
