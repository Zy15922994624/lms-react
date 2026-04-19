import type { UploadFile } from 'antd/es/upload/interface'
import { uploadService } from '@/shared/api/upload.service'
import type { TaskFile } from '@/features/tasks/types/task'

export type AttachmentUploadFile = UploadFile & { taskFile?: TaskFile }

export function toUploadFileList(attachments: TaskFile[] = []): AttachmentUploadFile[] {
  return attachments.map((attachment, index) => ({
    uid: `${attachment.key}-${index}`,
    name: attachment.name || attachment.originalName,
    status: 'done',
    url: attachment.url,
    taskFile: attachment,
  }))
}

export async function uploadAttachments(files: AttachmentUploadFile[]) {
  const result: TaskFile[] = []

  for (const file of files) {
    if (file.taskFile) {
      result.push(file.taskFile)
      continue
    }

    const rawFile = file.originFileObj
    if (!rawFile) {
      continue
    }

    const uploaded = await uploadService.uploadSingle(rawFile, 'attachment')
    result.push({
      key: uploaded.key,
      url: uploaded.url,
      originalName: uploaded.originalName,
      size: uploaded.size,
      mimeType: uploaded.mimeType,
      name: rawFile.name,
    })
  }

  return result
}
