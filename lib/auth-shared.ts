export interface SesionUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN_GENERAL" | "COORDINADOR" | "CATEQUISTA" | "CONSULTA";
}

export const NOMBRE_COOKIE = "catequesis_session";

// jerarquía de roles para permisos (mayor número = más permisos)
export const NIVEL_ROL: Record<SesionUsuario["rol"], number> = {
  CONSULTA: 1,
  CATEQUISTA: 2,
  COORDINADOR: 3,
  ADMIN_GENERAL: 4,
};

export function tienePermiso(rol: SesionUsuario["rol"], minimo: SesionUsuario["rol"]) {
  return NIVEL_ROL[rol] >= NIVEL_ROL[minimo];
}
