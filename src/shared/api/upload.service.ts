import client from '@/shared/api/client'
import type { UploadedFile, UploadScene } from '@/shared/types/upload'

export const uploadService = {
  async uploadSingle(file: File, scene: UploadScene = 'attachment') {
    const formData = new FormData()
    formData.append('file', file)

    return client.post<UploadedFile>('/upload/single', formData, {
      params: { scene },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
