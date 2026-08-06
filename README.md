# Sistema Inteligente de Evaluaciones para Catequesis Infantil

## Despliegue en la nube (Vercel + Neon) — recomendado
1. Crea una base de datos en https://neon.tech y copia el `DATABASE_URL`.
2. Sube este proyecto a un repositorio de GitHub.
3. Importa el repo en https://vercel.com/new
4. Variables de entorno en Vercel: `DATABASE_URL`, `JWT_SECRET`, y opcionalmente `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (notificaciones por correo).
5. Deploy.
6. Corre una vez, localmente, contra tu base de Neon: `npx prisma db push`.
7. Entra a `https://tu-dominio/admin/setup-inicial` UNA VEZ para crear tu usuario administrador.
8. Ingresa por `/admin/login`.

## Despliegue con Docker (self-hosted)
```bash
cp .env.example .env   # edita JWT_SECRET y DB_PASSWORD si quieres
docker compose up -d --build
```
Esto levanta Postgres + la app en http://localhost:3000, aplica el schema automáticamente
al iniciar, y persiste la base de datos y las imágenes subidas en volúmenes Docker.
Primer paso: visita `/admin/setup-inicial` una sola vez.

## Desarrollo local
```bash
npm install
cp .env.example .env   # apunta DATABASE_URL a tu Postgres (Neon, Docker, o local)
npx prisma generate
npx prisma db push
npm run dev
```

## Notas importantes
- La subida de imágenes (`/api/uploads`) guarda archivos en `public/uploads`. En Vercel esto
  NO persiste entre despliegues (serverless) — para producción real en Vercel, usa "pegar URL"
  o conecta un bucket (S3/Cloudinary/Firebase Storage). En Docker self-hosted sí persiste
  (volumen `uploads_data`).
- Ver `PROGRESS.md` para el detalle de qué está implementado y qué queda pendiente por fase.
