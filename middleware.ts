import { NextRequest, NextResponse } from "next/server";
import { verificarSesionEdge } from "@/lib/auth-edge";
import { NOMBRE_COOKIE } from "@/lib/auth-shared";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup-inicial")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(NOMBRE_COOKIE)?.value;
  const sesion = token ? await verificarSesionEdge(token) : null;

  if (!sesion) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirigir", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
