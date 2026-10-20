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

La migración `enable_unaccent_search` habilita la extensión PostgreSQL
[`unaccent`](https://neon.com/docs/extensions/unaccent), soportada por Neon.
`GET /recipes` compara título, nombre de ingrediente y autor sin distinguir
mayúsculas ni tildes (también `ñ`/`n`), sin modificar los textos guardados.
Los filtros se combinan con AND y se paginan en PostgreSQL. `%`, `_` y `\`
se buscan literalmente. La migración adicional `index_accent_search` instala
`pg_trgm` e índices GIN sobre título, ingrediente y autor, usando una función
inmutable con el diccionario `public.unaccent` fijo. Si se actualizan sus reglas
(incluido un upgrade de PostgreSQL), actualizar el mapa del picker del frontend
y ejecutar `REINDEX INDEX` sobre `recipes_title_search_idx`,
`ingredients_name_search_idx` y `users_name_search_idx`. Las búsquedas muy cortas
o poco selectivas todavía pueden requerir escaneos; el conteo exacto tiene costo.

El feed sin texto y sus filtros estructurados usan queries tipadas de Prisma.
Cuando hay texto, la búsqueda usa SQL parametrizado mediante Prisma para filtrar, contar y
obtener los IDs de la página: Prisma no permite aplicar `unaccent` a una columna
en `contains`. Es una excepción localizada a la convención de queries Prisma,
que debe revisarse con el equipo; no introduce otro query builder. Mantener
tablas, columnas y casts de `recipe-search.query.ts` sincronizados con el schema;
los tests de integración cubren todos los filtros. Prisma sigue leyendo y tipando
los datos de las cards. Ambas consultas comparten una transacción
`RepeatableRead`; el firmado de imágenes ocurre fuera de ella.

Aplicar `npm run prisma:migrate:deploy` antes de desplegar el código. El usuario
de `DIRECT_URL` necesita permiso CREATE y acceso a `unaccent` y `pg_trgm`.
Comprobar en Neon, con ese mismo rol, `has_database_privilege(current_user,
current_database(), 'CREATE')` y la disponibilidad en `pg_available_extensions`
antes del deploy. Esta verificación de producción debe hacerla el responsable
del entorno; las pruebas locales no acreditan sus permisos.
Las extensiones y los índices de expresión viven en migraciones SQL: Prisma
6.19 recomienda migraciones personalizadas, no el preview obsoleto
`postgresqlExtensions`:
https://docs.prisma.io/docs/orm/v6/prisma-schema/postgresql-extensions
La shadow DB reproduce estas migraciones; no instalar extensiones manualmente
solo en la base principal. CI ejecuta los e2e con `RUN_DATABASE_TESTS=true`.

`stabilize_fraction_search` unifica la expansión de fracciones entre PostgreSQL
16 y 17 (`½` → ` 1/2`) antes de aplicar `unaccent` y reconstruye los índices.
Así, el mismo texto se normaliza igual en CI, local y el picker del frontend.

`DATABASE_URL` es la conexión que usa la app y `DIRECT_URL` la que usa
`prisma migrate`. En local son iguales; en producción (Neon) `DATABASE_URL` es
la conexión *pooled* y `DIRECT_URL` la directa. Ambas se cargan en Render como
variables de entorno, nunca desde el repositorio.

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
  probar el guard de JWT en sí mismo. `withAuthenticatedUser(app)`
  sobreescribe `JwtAuthGuard` en la `INestApplication` ya creada (se llama
  entre `createNestApplication()` y `app.init()`) para que toda request quede
  autenticada como un usuario fijo (`request.user`), sin firmar ningún token
  ni llamar a Auth0. `withRejectedAuthentication(app)` hace lo opuesto:
  cualquier request devuelve 401, para probar ese caso sin necesitar un token
  inválido de verdad.

  ```ts
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  withAuthenticatedUser(app);
  await app.init();
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
