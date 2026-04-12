import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Button, Form, Input, Modal, Select } from 'antd'
import { InboxOutlined, UploadOutlined } from '@ant-design/icons'
import { useDeferredUpload } from '@/shared/hooks/useDeferredUpload'
import { uiMessage } from '@/shared/components/feedback/message'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import type {
  CourseResource,
  CourseResourceFormValues,
  CourseResourceType,
  CreateCourseResourcePayload,
  UpdateCourseResourcePayload,
} from '@/features/courses/types/course-resource'

interface BaseCourseResourceFormModalProps {
  open: boolean
  loading?: boolean
  onCancel: () => void
}

interface CreateCourseResourceFormModalProps extends BaseCourseResourceFormModalProps {
  mode: 'create'
  onSubmit: (payload: CreateCourseResourcePayload) => Promise<unknown>
}

interface EditCourseResourceFormModalProps extends BaseCourseResourceFormModalProps {
  mode: 'edit'
  initialValues: CourseResource
  onSubmit: (payload: UpdateCourseResourcePayload) => Promise<unknown>
}

type CourseResourceFormModalProps =
  | CreateCourseResourceFormModalProps
  | EditCourseResourceFormModalProps

const resourceTypeOptions: Array<{ label: string; value: CourseResourceType }> = [
  { label: '文档', value: 'document' },
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' },
  { label: '其他', value: 'other' },
]

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${size} B`
}

export default function CourseResourceFormModal(props: CourseResourceFormModalProps) {
  const { open, loading = false, onCancel } = props
  const { isMobile } = useResponsiveLayout()
  const initialValues = props.mode === 'edit' ? props.initialValues : undefined
  const [form] = Form.useForm<CourseResourceFormValues>()
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { selectedFile, uploading, selectFile, clearSelection, uploadSelectedFile } =
    useDeferredUpload({
      scene: 'attachment',
      maxSizeInMb: 50,
      invalidTypeMessage: '当前文件类型暂不支持上传',
      invalidSizeMessage: '文件大小不能超过 50MB',
    })

  useEffect(() => {
    if (!open) {
      return
    }

    form.setFieldsValue({
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      type: initialValues?.type ?? 'document',
    })
  }, [clearSelection, form, initialValues, open])

  const pickFile = (file?: File | null) => {
    if (!file) return

    const isAccepted = selectFile(file)
    if (!isAccepted && fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    pickFile(event.target.files?.[0])
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(false)
    pickFile(event.dataTransfer.files?.[0])
  }

  const handleFinish = async (values: CourseResourceFormValues) => {
    if (props.mode === 'create') {
      if (!selectedFile) {
        uiMessage.error('请先选择资源文件')
        return
      }

      const uploadedFile = await uploadSelectedFile()
      if (!uploadedFile) return

      await props.onSubmit({
        ...values,
        fileKey: uploadedFile.key,
        fileUrl: uploadedFile.url,
        originalFileName: uploadedFile.originalName,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
      })
      return
    }

    await props.onSubmit(values)
  }

  return (
    <Modal
      open={open}
      title={props.mode === 'create' ? '上传课程资源' : '编辑资源信息'}
      okText={props.mode === 'create' ? '上传并保存' : '保存'}
      cancelText="取消"
      confirmLoading={loading || uploading}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      width={isMobile ? 'calc(100vw - 20px)' : undefined}
      afterOpenChange={(visible) => {
        if (visible) {
          return
        }

        clearSelection()
        setIsDragActive(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }}
    >
      <Form<CourseResourceFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Form.Item
          label="资源标题"
          name="title"
          rules={[{ required: true, message: '请输入资源标题' }]}
        >
          <Input placeholder="例如：第一章实验指导书" maxLength={100} />
        </Form.Item>

        <Form.Item
          label="资源类型"
          name="type"
          rules={[{ required: true, message: '请选择资源类型' }]}
        >
          <Select options={resourceTypeOptions} />
        </Form.Item>

        <Form.Item label="资源说明" name="description">
          <Input.TextArea placeholder="可选" rows={4} maxLength={500} showCount />
        </Form.Item>

        {props.mode === 'create' ? (
          <Form.Item label="资源文件" required>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                'group w-full rounded-[26px] border border-dashed px-5 py-5 text-left transition',
                isDragActive
                  ? 'border-[rgba(255,107,53,0.58)] bg-[linear-gradient(180deg,#fff4ec_0%,#fffaf6_100%)] shadow-[0_18px_36px_rgba(255,107,53,0.12)]'
                  : 'border-[rgba(255,107,53,0.24)] bg-[linear-gradient(180deg,#fffaf6_0%,#fffdfb_100%)] hover:border-[rgba(255,107,53,0.42)] hover:bg-white',
              ].join(' ')}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--lms-color-primary-soft)] text-[var(--lms-color-primary)]">
                  {selectedFile ? <InboxOutlined /> : <UploadOutlined />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-stone-900">
                    {selectedFile ? selectedFile.name : '拖拽文件到这里，或点击选择文件'}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-stone-500">
                    {selectedFile
                      ? `文件大小 ${formatFileSize(selectedFile.size)}`
                      : '单文件不超过 50MB'}
                  </div>

                  {selectedFile ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-[0_8px_18px_rgba(28,25,23,0.05)]">
                        待上传
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-[0_8px_18px_rgba(28,25,23,0.05)]">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {selectedFile ? (
                  <Button
                    type="text"
                    onClick={(event) => {
                      event.stopPropagation()
                      clearSelection()
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    清除
                  </Button>
                ) : null}
              </div>
            </div>
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  )
}
