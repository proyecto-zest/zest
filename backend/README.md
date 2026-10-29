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

`GET /recipes` compara título, nombre de ingrediente y autor sin distinguir
mayúsculas ni tildes (también `ñ`/`n`), sin modificar los textos guardados.
Los filtros se combinan con AND; `%`, `_` y `\` se buscan literalmente.
`enable_unaccent_search` habilita `unaccent` e `index_accent_search` agrega
`pg_trgm`, la función simple `search_unaccent` y los índices GIN de búsqueda.
Aplicar las migraciones con `npm run prisma:migrate:deploy`; el rol de
`DIRECT_URL` necesita permisos para instalar ambas extensiones.

Los filtros estructurados comparten definición entre Prisma y SQL. Solo la
búsqueda textual usa SQL parametrizado con `unaccent` y una transacción
`RepeatableRead`; el feed sin texto usa Prisma sin transacción. El firmado de
imágenes queda fuera de la transacción.
Si cambia el diccionario de `unaccent`, reconstruir los índices
`recipes_title_search_idx`, `ingredients_name_search_idx` y `users_name_search_idx`.
Las búsquedas cortas o poco selectivas pueden requerir escaneos.

El filtro local de ingredientes usa NFD. No replica las equivalencias de
caracteres como `ß`, `æ`, `ø`, `ł` o fracciones de PostgreSQL. CI verifica la
búsqueda sin tildes y mayúsculas sobre PostgreSQL 16.

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

## Asignar una receta al planificador

`POST /planner` requiere un access token válido y un usuario local ya sincronizado
por `GET /users/me`. El usuario se obtiene de la sesión; no se acepta `userId` en
el body. Permite recetas propias o de otro usuario.

```json
{ "recipeId": "UUID de la receta", "date": "2026-11-03", "quantity": 2 }
```

Los tres campos son obligatorios. `date` debe ser una fecha real `YYYY-MM-DD`,
sin hora ni zona horaria. `quantity` debe ser un entero entre 1 y 100. Repetir
usuario/receta/fecha suma la cantidad sobre la misma entrada; si el total supera
100, responde 400 y revierte la operación. Fechas pasadas están permitidas.

Devuelve 201 tanto al crear una entrada como al incrementar una existente,
con `id`, `date`, `quantity`, `recipeId`, `title`, `imageUrl`, `time`
y `timeUnit` (el enum actual `MINUTOS`/`HORAS`). `imageUrl` es una URL firmada de
una foto de la receta, o `null` cuando no hay imágenes. Un UUID de receta
inexistente devuelve 404; entradas inválidas devuelven 400.

La base también exige `quantity` entre 1 y 100 mediante el `CHECK` de ZEST-118;
su rechazo se traduce a 400 y no modifica la cantidad anterior.
El planner selecciona la imagen por ID ascendente, igual que las cards. Es un
criterio estable, no un orden de subida ni una portada marcada en el modelo.
La URL se firma antes de escribir: si el firmado falla, no se crea ni incrementa
la entrada. El upsert utiliza `ON CONFLICT` para sumar atómicamente incluso con
requests concurrentes; el `CHECK` de la base aplica el límite sin una transacción
adicional. Si el usuario se elimina durante la request, responde 401.

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
