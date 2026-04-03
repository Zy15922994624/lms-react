export type UploadScene = 'image' | 'attachment'

export interface UploadedFile {
  key: string
  url: string
  originalName: string
  size: number
  mimeType: string
}
