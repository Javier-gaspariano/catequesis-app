import { jwtVerify } from "jose";
import { SesionUsuario } from "./auth-shared";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "cambia-esto-en-produccion");

export async function verificarSesionEdge(token: string): Promise<SesionUsuario | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SesionUsuario;
  } catch {
    return null;
  }
}
