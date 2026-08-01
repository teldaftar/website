import { api } from './http'
import type { UploadResult } from './types'

/** Upload an image to `POST /uploads/image` (multipart, field name `file`). */
export function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  return api
    .post<UploadResult>('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
    .then((r) => r.data)
}
