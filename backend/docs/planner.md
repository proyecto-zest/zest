# API del planificador

Base: la URL del backend, sin prefijo `/api`. Todas las rutas requieren
`Authorization: Bearer <access_token>` de Auth0. Antes del primer uso, llamar
a `GET /users/me` con ese token para sincronizar el usuario local. El backend
resuelve el usuario con `@CurrentUser()`; no se envía `userId`.

## Respuesta de una entrada

POST y PATCH devuelven un `PlannerEntryResponseDto`; GET devuelve un array de
ese mismo contrato:

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "date": "2026-11-03",
  "quantity": 2,
  "recipeId": "22222222-2222-4222-8222-222222222222",
  "title": "Lemon chicken",
  "imageUrl": null,
  "time": 20,
  "timeUnit": "MINUTOS"
}
```

`id` y `recipeId` son UUID. `date` es una fecha de calendario `YYYY-MM-DD`,
sin conversión de zona horaria. `quantity` es entero entre 1 y 100.
`timeUnit` usa el enum `MINUTOS`/`HORAS` de la receta.
`imageUrl` es una URL firmada de S3 (15 minutos), o `null` si no hay imágenes;
no es una key ni una URL permanente. El planner selecciona una imagen por ID
ascendente, un criterio estable que no implica orden de subida ni portada.

## POST /planner

Body JSON, con los tres campos obligatorios:

```json
{
  "recipeId": "22222222-2222-4222-8222-222222222222",
  "date": "2026-11-03",
  "quantity": 2
}
```

Permite recetas propias o ajenas y fechas pasadas. Devuelve **201** con la
entrada. Repetir usuario/receta/fecha suma `quantity` sobre la misma fila,
también con 201; no es una operación idempotente. La suma es atómica mediante
upsert y el CHECK de base impide superar 100, sin modificar la cantidad previa.
La imagen se firma antes de escribir: si el firmado falla no hay incremento.

Errores: **400** por UUID, fecha, cantidad o campos adicionales inválidos, o
si la suma supera 100; **404** si la receta no existe; **401** sin autenticación
válida o sin usuario local (también si se elimina antes del upsert).

## GET /planner?from=2026-11-03&to=2026-11-09

`from` y `to` son query params obligatorios con fechas reales `YYYY-MM-DD`.
El rango incluye ambos extremos, debe estar ordenado y admite hasta **31 días**
en total. No acepta hora ni zona horaria.

Devuelve **200** con un array de entradas del usuario autenticado, ordenadas
por fecha e ID ascendentes, o `[]` si no hay ninguna. Cada key de imagen se
firma una sola vez por request, aunque aparezca en varios días.
Errores: **400** por fechas inválidas, rango invertido o mayor a 31 días;
**401** sin autenticación válida o sin usuario local.

## PATCH /planner/:id

Path: `id` UUID de la entrada. Body JSON:

```json
{ "quantity": 3 }
```

`quantity` es obligatorio, entero entre 1 y 100 (no acepta strings numéricos).
Reemplaza la cantidad con ese valor absoluto, sin sumar ni cambiar fecha o
receta. Devuelve **200** con la entrada actualizada. La imagen se firma antes
de persistir; un fallo del firmado no modifica la cantidad.

Errores: **400** por UUID/body inválido o campos adicionales; **401** sin
autenticación válida o sin usuario local; **403** si la entrada es ajena;
**404** si no existe o desaparece antes de actualizarla.

## DELETE /planner/:id

Path: `id` UUID de la entrada. No lleva body. Devuelve **204 sin contenido**.
Elimina únicamente la entrada propia; conserva la receta, sus imágenes y las
demás entradas. Errores: **400** por UUID inválido; **401** sin autenticación
válida o sin usuario local; **403** si es ajena; **404** si no existe o ya fue
borrada al completar la operación.

Borrar la **receta**, en cambio, elimina por CASCADE sus entradas del planner
de todos los usuarios, según el modelo de ZEST-118.

Los errores usan las excepciones HTTP de Nest (`statusCode`, `message`, `error`).
`message` puede ser un array para errores de validación.

## Prueba manual y suites

Con un access token vigente, una receta existente y el backend levantado:

```bash
curl -i http://localhost:3000/users/me -H "Authorization: Bearer $TOKEN"
curl -i 'http://localhost:3000/planner?from=2026-11-03&to=2026-11-09' \
  -H "Authorization: Bearer $TOKEN"
```

Para POST/PATCH, enviar los bodies de arriba con `Content-Type: application/json`.
Para DELETE usar el `id` de la entrada, no el de la receta.

Desde `backend/`, con PostgreSQL local disponible:

```bash
RUN_DATABASE_TESTS=true npm test -- --runInBand \
  planner-entries.e2e-spec planner-list.e2e-spec \
  planner-delete.e2e-spec planner-update.e2e-spec
```

Jest aplica migraciones a la base aislada de `.env.test`; los helpers simulan
autenticación y S3, sin llamar a Auth0 ni al bucket real. Estas suites verifican
el contrato junto con los DTOs y services de `src/planner-entries/`.
