import { FileUtils } from '@/shared/utils/file'

// 上传与资源处理：保留和业务上传链路强相关的能力
export class UploadUtils {
  static createSafeFormData(
    file: File,
    additionalData: Record<string, string | number | boolean> = {},
  ): FormData {
    const formData = new FormData()
    const encodedFileName = FileUtils.encodeFileName(file.name)
    const encodedFile = new File([file], encodedFileName, {
      type: file.type,
      lastModified: file.lastModified,
    })

    formData.append('file', encodedFile)

    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    formData.append('originalFileName', file.name)

    return formData
  }

  static getResourceType(file: File): string {
    const mimeType = file.type
    const extension = FileUtils.getFileExtension(file.name)

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image'
    }

    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return 'video'
    }

    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'aac'].includes(extension)) {
      return 'audio'
    }

    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      return 'document'
    }

    return 'other'
  }
}
