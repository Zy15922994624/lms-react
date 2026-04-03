import { useCallback, useEffect, useMemo, useState } from 'react'
import { uploadService } from '@/shared/api/upload.service'
import { uiMessage } from '@/shared/components/feedback/message'
import type { UploadScene, UploadedFile } from '@/shared/types/upload'

interface UseDeferredUploadOptions {
  scene: UploadScene
  maxSizeInMb: number
  accept?: (file: File) => boolean
  invalidTypeMessage: string
  invalidSizeMessage: string
  enablePreview?: boolean
}

interface UseDeferredUploadResult {
  selectedFile: File | null
  previewUrl?: string
  uploading: boolean
  selectFile: (file: File) => boolean
  clearSelection: () => void
  uploadSelectedFile: () => Promise<UploadedFile | null>
}

export function useDeferredUpload({
  scene,
  maxSizeInMb,
  accept,
  invalidTypeMessage,
  invalidSizeMessage,
  enablePreview = false,
}: UseDeferredUploadOptions): UseDeferredUploadResult {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const previewUrl = useMemo(() => {
    if (!enablePreview || !selectedFile) return undefined
    return URL.createObjectURL(selectedFile)
  }, [enablePreview, selectedFile])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const selectFile = useCallback(
    (file: File) => {
      if (accept && !accept(file)) {
        uiMessage.error(invalidTypeMessage)
        return false
      }

      const isWithinLimit = file.size / 1024 / 1024 < maxSizeInMb
      if (!isWithinLimit) {
        uiMessage.error(invalidSizeMessage)
        return false
      }

      setSelectedFile(file)
      return true
    },
    [accept, invalidSizeMessage, invalidTypeMessage, maxSizeInMb],
  )

  const clearSelection = useCallback(() => {
    setSelectedFile(null)
  }, [])

  const uploadSelectedFile = useCallback(async () => {
    if (!selectedFile) return null

    setUploading(true)
    try {
      return await uploadService.uploadSingle(selectedFile, scene)
    } finally {
      setUploading(false)
    }
  }, [scene, selectedFile])

  return {
    selectedFile,
    previewUrl,
    uploading,
    selectFile,
    clearSelection,
    uploadSelectedFile,
  }
}
