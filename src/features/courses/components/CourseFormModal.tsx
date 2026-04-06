import { useEffect } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Button, Form, Input, InputNumber, Modal, Upload } from 'antd'
import type { CourseDetail, CourseFormValues } from '@/features/courses/types/course'
import { useDeferredUpload } from '@/shared/hooks/useDeferredUpload'

interface CourseFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  loading?: boolean
  initialValues?: CourseDetail | null
  onCancel: () => void
  onSubmit: (values: CourseFormValues) => Promise<unknown> | void
}

export default function CourseFormModal({
  open,
  mode,
  loading = false,
  initialValues,
  onCancel,
  onSubmit,
}: CourseFormModalProps) {
  const [form] = Form.useForm<CourseFormValues>()
  const remoteCoverPreview = Form.useWatch('coverImage', form)
  const {
    selectedFile: selectedCoverFile,
    previewUrl: localCoverPreview,
    uploading,
    selectFile,
    clearSelection,
    uploadSelectedFile,
  } = useDeferredUpload({
    scene: 'image',
    maxSizeInMb: 5,
    accept: (file) => file.type.startsWith('image/'),
    invalidTypeMessage: '只能选择图片文件',
    invalidSizeMessage: '图片大小不能超过 5MB',
    enablePreview: true,
  })

  useEffect(() => {
    if (!open) {
      clearSelection()
      return
    }

    if (mode === 'edit' && initialValues) {
      form.setFieldsValue({
        title: initialValues.title,
        description: initialValues.description,
        courseCode: initialValues.courseCode,
        coverImage: initialValues.coverImage,
        semester: initialValues.semester,
        credits: initialValues.credits,
        maxStudents: initialValues.maxStudents,
      })
      clearSelection()
      return
    }

    form.resetFields()
    clearSelection()
  }, [clearSelection, form, initialValues, mode, open])

  const beforeCoverUpload: UploadProps['beforeUpload'] = (file) => {
    const accepted = selectFile(file as File)
    return accepted ? false : Upload.LIST_IGNORE
  }

  const coverPreview = localCoverPreview || remoteCoverPreview

  const handleFinish = async (values: CourseFormValues) => {
    let nextCoverImage = values.coverImage

    if (selectedCoverFile) {
      const uploadedFile = await uploadSelectedFile()
      nextCoverImage = uploadedFile?.key
    }

    await onSubmit({
      ...values,
      coverImage: nextCoverImage,
    })
  }

  return (
    <Modal
      title={mode === 'create' ? '创建课程' : '编辑课程'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={mode === 'create' ? '创建' : '保存'}
      cancelText="取消"
      confirmLoading={loading || uploading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="课程标题"
          name="title"
          rules={[
            { required: true, message: '请输入课程标题' },
            { max: 100, message: '课程标题不能超过 100 个字符' },
          ]}
        >
          <Input placeholder="例如：如何学习前端" />
        </Form.Item>

        <Form.Item
          label="课程说明"
          name="description"
          rules={[{ max: 1000, message: '课程说明不能超过 1000 个字符' }]}
        >
          <Input.TextArea rows={4} placeholder="输入课程简介、授课目标或学习要求" />
        </Form.Item>

        <Form.Item label="课程封面" name="coverImage">
          <div className="space-y-3">
            <Upload
              accept="image/*"
              maxCount={1}
              showUploadList={false}
              beforeUpload={beforeCoverUpload}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {selectedCoverFile ? '重新选择封面' : '选择封面'}
              </Button>
            </Upload>
            {/* <div className="text-xs leading-5 text-stone-400">
              封面会在提交表单时上传，取消编辑不会产生垃圾文件。
            </div> */}
            {coverPreview ? (
              <div className="overflow-hidden rounded-[20px] border border-[var(--lms-color-border)] bg-[linear-gradient(180deg,#fff7f2_0%,#fffdfb_100%)]">
                <img
                  src={
                    coverPreview.startsWith('/') || coverPreview.startsWith('blob:')
                      ? coverPreview
                      : `/${coverPreview}`
                  }
                  alt="课程封面预览"
                  className="h-[180px] w-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--lms-color-border)] px-4 py-5 text-sm text-stone-400">
                未上传封面
              </div>
            )}
          </div>
        </Form.Item>

        <div className="grid gap-4 sm:grid-cols-2">
          <Form.Item
            label="课程代码"
            name="courseCode"
            rules={[
              {
                pattern: /^[A-Z]{2}\d{3}$/,
                message: '课程代码格式应为两位大写字母加三位数字，例如 CS101',
              },
            ]}
          >
            <Input placeholder="例如：CS101" />
          </Form.Item>

          <Form.Item
            label="开课学期"
            name="semester"
            rules={[{ max: 50, message: '开课学期不能超过 50 个字符' }]}
          >
            <Input placeholder="例如：2025-2026 第一学期" />
          </Form.Item>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Form.Item label="学分" name="credits">
            <InputNumber className="!w-full" min={0} max={20} placeholder="0-20" />
          </Form.Item>

          <Form.Item label="最大人数" name="maxStudents">
            <InputNumber
              className="!w-full"
              min={1}
              max={500}
              placeholder="1-500，留空表示不限制"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
