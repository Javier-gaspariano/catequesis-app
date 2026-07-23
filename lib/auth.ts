import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { SesionUsuario, NOMBRE_COOKIE, NIVEL_ROL } from "./auth-shared";

export type { SesionUsuario };
export { NOMBRE_COOKIE, NIVEL_ROL };

const SECRET = process.env.JWT_SECRET ?? "cambia-esto-en-produccion";


export function firmarSesion(usuario: SesionUsuario): string {
  return jwt.sign(usuario, SECRET, { expiresIn: "7d" });
}

export function verificarSesion(token: string): SesionUsuario | null {
  try {
    return jwt.verify(token, SECRET) as SesionUsuario;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function compararPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
