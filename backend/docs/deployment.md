# Despliegue del backend: Render y Neon

El backend es un Web Service Docker de Render; PostgreSQL vive en Neon y las
imágenes en S3. Render usa el repositorio `proyecto-zest/zest`, rama `main`.
El frontend se despliega por separado en Vercel.

## Configuración de entorno

La lista local está en [`../.env.example`](../.env.example). En producción los
valores se cargan en **Render → zest-backend → Environment**; no se suben
archivos `.env`, credenciales ni connection strings reales al repositorio.

| Variable | Uso / valor esperado |
| --- | --- |
| `DATABASE_URL` | Conexión pooled de Neon, usada por Prisma Client. Mantener los parámetros TLS que entrega Neon. |
| `DIRECT_URL` | Conexión directa de la misma base Neon, usada por `prisma migrate deploy`. Mantener TLS. |
| `CORS_ORIGIN` | Orígenes permitidos del frontend, separados por coma, sin paths. Para previews, usar un patrón limitado al proyecto, p. ej. `https://zest-frontend-*-zest20.vercel.app`; no `https://*.vercel.app`. |
| `AUTH0_DOMAIN` | Dominio del tenant sin `https://` ni slash final. |
| `AUTH0_AUDIENCE` | Identifier exacto del API en Auth0. No es el Client ID. |
| `AWS_S3_BUCKET` | Nombre del bucket privado. |
| `AWS_S3_REGION` | Región AWS del bucket. |
| `AWS_ACCESS_KEY_ID` | ID de la credencial IAM del backend. |
| `AWS_SECRET_ACCESS_KEY` | Secreto de esa credencial IAM. |
| `PORT` | Puerto HTTP. Local: 3000; en Render usar el valor provisto por la plataforma. |
| `NODE_ENV` | `production` en la imagen runtime; por defecto `development` fuera de Docker. |

No se usa Auth0 Client Secret para validar access tokens. El rol de `DIRECT_URL`
debe poder aplicar DDL e instalar `unaccent` y `pg_trgm` para las migraciones
de búsqueda. El bucket requiere permisos de lectura, subida y borrado de
objetos, además de listar el bucket; el CORS de S3 habilita el PUT directo del
navegador. La configuración de Auth0 y los permisos de AWS los entrega el equipo.

## Flujo automático (ZEST-79)

El contrato de despliegue está en `render.yaml` (ZEST-79):

- Servicio existente `zest-backend`, tipo `web`, runtime `docker`, plan `free`.
- `dockerfilePath: ./backend/Dockerfile`, `dockerContext: ./backend`.
- Rama `main`, `autoDeployTrigger: checksPass`, `healthCheckPath: /health`.
- Variables con `sync: false`: sus valores se administran en Render.

Si el servicio se creó manualmente, al vincular el Blueprint revisar que
actualice **ese mismo servicio**, sin crear otro. Es una configuración inicial;
los merges posteriores no requieren ejecutar migraciones manualmente.

Después de integrar ZEST-79, el recorrido de un merge a `main` es:

1. GitHub Actions ejecuta CI (migraciones, lint, build y tests) y frontend.
2. Con los checks aprobados, Render construye las etapas del Dockerfile.
   El CLI `prisma` debe estar en las dependencias de producción.
3. El CMD ejecuta `npm run prisma:migrate:deploy && exec npm run start:prod`.
   Usa `DIRECT_URL`, aplica únicamente migraciones pendientes y solo arranca
   Nest si terminó correctamente. Un fallo de migración aborta el arranque.
4. Render comprueba `/health` antes de promover la nueva instancia. No se usa
   `preDeployCommand`: el plan gratuito no lo soporta.

La configuración todavía debe estar aplicada en Render para que el archivo
controle el servicio. El cierre de ZEST-79 incluye verificar ese vínculo y
el primer deploy; documentar el flujo no certifica un deploy de producción.

## Verificación y fallos

En los logs de Render comprobar el commit de `main`, el build, la salida de
`prisma migrate deploy` y el arranque de Nest. Consultar `GET /health` en la URL
pública del servicio: sin token debe devolver
`{"status":"ok","db":"connected"}`.

El health check de Render comprueba el HTTP de `/health`. Actualmente ese
endpoint puede devolver HTTP 200 con `db: "disconnected"`; para comprobar la
conexión a Neon hay que revisar también el body. El HTTP por sí solo no detecta
una desconexión de base posterior al arranque.

Si falla una migración, revisar `DIRECT_URL`, permisos y el error concreto en
los logs; corregir mediante el flujo de migraciones del repo. No ejecutar
`migrate reset` contra producción ni editar migraciones ya aplicadas. El rollback
del código no revierte cambios de schema; las migraciones deben ser compatibles
con la versión anterior mientras conviven ambas instancias.

Referencia: [Blueprint YAML](https://render.com/docs/blueprint-spec) y
[health checks de Render](https://render.com/docs/health-checks).
