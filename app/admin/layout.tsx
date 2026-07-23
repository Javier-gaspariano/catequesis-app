import { cookies } from "next/headers";
import { verificarSesion, NOMBRE_COOKIE } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/examenes", label: "Exámenes", icon: "📝" },
  { href: "/admin/preguntas", label: "Banco de preguntas", icon: "🗂️" },
  { href: "/admin/carga-masiva", label: "Carga masiva", icon: "⬆️" },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: "📈" },
  { href: "/admin/resultados", label: "Exámenes realizados", icon: "🗒️" },
  { href: "/admin/catequistas", label: "Catequistas", icon: "🧑‍🏫" },
  { href: "/admin/capillas", label: "Capillas", icon: "⛪" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(NOMBRE_COOKIE)?.value;
  const sesion = token ? verificarSesion(token) : null;

  return (
    <div className="flex min-h-[100dvh] flex-col sm:flex-row">
      <AdminNav nav={nav} sesion={sesion} />
      <main className="flex-1 bg-crema p-6 sm:p-8">{children}</main>
    </div>
  );
}
