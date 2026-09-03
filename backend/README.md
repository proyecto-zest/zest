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

Las imágenes de recetas del entorno de desarrollo se almacenan en el bucket
S3 `zest-recipes`, ubicado en la región `us-east-1`. El backend obtiene el
bucket, la región y las credenciales exclusivamente desde las variables
`AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID` y
`AWS_SECRET_ACCESS_KEY`.

El bucket es privado. La base de datos guarda únicamente la key de cada objeto
y la API genera URLs firmadas de lectura con una duración de 15 minutos. El
frontend subirá el binario directamente mediante la URL firmada de subida que
proveerá ZEST-70; el archivo nunca pasa por este backend.

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

Los tests end-to-end que verifican PostgreSQL real se habilitan con
`RUN_DATABASE_TESTS=true npm test`. Jest usa automáticamente `.env.test`, aplica
las migraciones sobre la base aislada `zest_test` y rechaza cualquier operación
de limpieza si `DATABASE_URL` no termina en `_test`. El workflow de CI los
ejecuta automáticamente contra su servicio PostgreSQL.

## CI y protección de `main`

`.github/workflows/ci.yml` ejecuta instalación limpia, migraciones, lint, build
y tests con cobertura en cada pull request y cada push a `main`. La
configuración del repo en GitHub debe requerir el check `CI` y una aprobación
antes de permitir el merge a `main`.
