import { httpClient } from './httpClient'

/** Mirrors the backend's `RECIPE_IMAGE_CONTENT_TYPES` allowlist. */
export const RECIPE_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Client-side only: the backend doesn't cap the body size, so this is the app's own limit. */
export const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024

interface PresignedUpload {
  uploadUrl: string
  imageKey: string
}

/** Asks the backend for a short-lived URL to `PUT` one image straight to S3. */
const requestPresignedUpload = (contentType: string) =>
  httpClient.post<PresignedUpload>('/recipes/image-upload-url', { contentType })

/** Why a file can't be uploaded, or `null` when it's fine. */
export function validateRecipeImage(file: File): string | null {
  if (!RECIPE_IMAGE_CONTENT_TYPES.includes(file.type as (typeof RECIPE_IMAGE_CONTENT_TYPES)[number])) {
    return 'Images must be JPEG, PNG or WebP.'
  }
  if (file.size > MAX_RECIPE_IMAGE_BYTES) {
    return `Images must be under ${MAX_RECIPE_IMAGE_BYTES / 1024 / 1024} MB.`
  }
  return null
}

/**
 * Sends the binary straight to S3 — deliberately raw `fetch`, not `httpClient`:
 * S3 signs the request, so an extra `Authorization` header would break the
 * signature. Resolves to nothing; a non-2xx throws with the status attached so
 * the caller can tell an expired URL (403) from anything else.
 */
async function putToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  if (!response.ok) {
    const error = new Error(`Upload failed (${response.status})`) as Error & { status: number }
    error.status = response.status
    throw error
  }
}

/**
 * Uploads one recipe image and resolves to the S3 key the backend expects —
 * the binary never touches our API. A presigned URL that already expired comes
 * back as a 403, which is worth exactly one retry with a freshly minted URL.
 */
export async function uploadRecipeImage(file: File): Promise<string> {
  const invalid = validateRecipeImage(file)
  if (invalid) throw new Error(invalid)

  const first = await requestPresignedUpload(file.type)
  try {
    await putToS3(first.uploadUrl, file)
    return first.imageKey
  } catch (error) {
    if ((error as { status?: number }).status !== 403) throw error
    const retry = await requestPresignedUpload(file.type)
    await putToS3(retry.uploadUrl, file)
    return retry.imageKey
  }
}
