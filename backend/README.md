# Zest backend

API de Zest construida con NestJS, TypeScript, Prisma y PostgreSQL.

## Requisitos

- Node.js 22
- npm
- Docker y Docker Compose

## Instalación inicial

```bash
git clone https://github.com/proyecto-zest/zest.git
cd zest/backend
npm install
cp .env.example .env
docker compose up -d postgres
npm run prisma:migrate:dev
npm run start:dev
```

Antes de conectar servicios reales, reemplazá en `.env` los placeholders de
Auth0 y AWS. `CORS_ORIGIN` debe apuntar al origen del frontend. Nunca subas el
archivo `.env` al repositorio.

La API queda disponible en `http://localhost:3000`. El health-check se puede
probar con:

```bash
curl http://localhost:3000/health
```

Con PostgreSQL conectado responde:

```json
{ "status": "ok", "db": "connected" }
```

## Uso diario

Para trabajar con Node.js en el host y únicamente PostgreSQL en Docker:

```bash
docker compose up -d postgres
npm run start:dev
```

Para levantar API, migraciones y PostgreSQL en contenedores, sin pasos
adicionales:

```bash
docker compose up --build
```

El servicio `migrate` espera a que PostgreSQL esté sano y aplica las migraciones
pendientes. La API arranca cuando esa tarea termina correctamente.

## Comandos útiles

```bash
npm run lint                  # valida ESLint y Prettier
npm run build                 # compila el proyecto
npm test                      # ejecuta tests unitarios
npm run test:cov              # tests con cobertura mínima de 75%
npm run prisma:generate       # regenera Prisma Client
npm run prisma:migrate:dev    # crea/aplica migraciones locales
```

El test end-to-end que verifica PostgreSQL real se habilita con
`RUN_DATABASE_TESTS=true`; el workflow de CI lo ejecuta automáticamente contra
su servicio PostgreSQL.

## CI y protección de `main`

`.github/workflows/ci.yml` ejecuta instalación limpia, migraciones, lint, build
y tests con cobertura en cada pull request y cada push a `main`. La
configuración del repo en GitHub debe requerir el check `CI` y una aprobación
antes de permitir el merge a `main`.
