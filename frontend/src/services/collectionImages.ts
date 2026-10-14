import { httpClient } from './httpClient'
import { uploadImage } from './recipeImages'

interface CollectionCoverUpload {
  uploadUrl: string
  coverImageKey: string
}

/** Uses the collection endpoint so the generated key belongs to collections/, not recipes/. */
const requestCoverUpload = async (contentType: string) => {
  const { uploadUrl, coverImageKey } = await httpClient.post<CollectionCoverUpload>(
    '/collections/cover-upload-url',
    { contentType },
  )
  return { uploadUrl, imageKey: coverImageKey }
}

export const uploadCollectionCover = (file: File) => uploadImage(file, requestCoverUpload)
