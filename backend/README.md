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
y la API genera URLs firmadas con una duración de 15 minutos. Para subir una
imagen, el frontend solicita una URL mediante `POST /recipes/image-upload-url`,
sube el binario directamente a esa URL con `PUT` y envía la `imageKey` devuelta
al crear o editar la receta. El archivo nunca pasa por este backend.

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

### Tests de rutas protegidas

Hay dos helpers en `test/`, para dos necesidades distintas:

- **`test/protected-route-test-helper.ts`** — el camino rápido para cualquier
  ticket que solo necesita "una request de un usuario autenticado", sin
  probar el guard de JWT en sí mismo. `withAuthenticatedUser(builder)`
  sobreescribe `JwtAuthGuard` en el `TestingModuleBuilder` para que toda
  request quede autenticada como un usuario fijo (`request.user`), sin firmar
  ningún token ni llamar a Auth0. `withRejectedAuthentication(builder)` hace
  lo opuesto: cualquier request devuelve 401, para probar ese caso sin
  necesitar un token inválido de verdad.

  ```ts
  const moduleFixture = await withAuthenticatedUser(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();
  ```

- **`test/auth-test-helper.ts`** — para probar el guard/la validación de JWT
  en sí (por ejemplo `test/auth.e2e-spec.ts`). Genera un par de claves RSA,
  mockea `jwks-rsa` para servir la pública, y firma tokens reales con
  `createTestToken(...)` contra la privada. Bastante más pesado: solo hace
  falta cuando el propio mecanismo de autenticación es lo que se está
  probando, no cuando un endpoint protegido simplemente necesita un usuario
  de prueba.

## CI y protección de `main`

`.github/workflows/ci.yml` ejecuta instalación limpia, migraciones, lint, build
y tests con cobertura en cada pull request y cada push a `main`. La
configuración del repo en GitHub debe requerir el check `CI` y una aprobación
antes de permitir el merge a `main`.
