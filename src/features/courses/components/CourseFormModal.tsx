import { useEffect } from 'react'
import { Form, Input, InputNumber, Modal } from 'antd'
import type { CourseDetail, CourseFormValues } from '@/features/courses/types/course'

interface CourseFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  loading?: boolean
  initialValues?: CourseDetail | null
  onCancel: () => void
  onSubmit: (values: CourseFormValues) => void
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

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialValues) {
      form.setFieldsValue({
        title: initialValues.title,
        description: initialValues.description,
        courseCode: initialValues.courseCode,
        semester: initialValues.semester,
        credits: initialValues.credits,
        maxStudents: initialValues.maxStudents,
      })
      return
    }

    form.resetFields()
  }, [form, initialValues, mode, open])

  return (
    <Modal
      title={mode === 'create' ? '创建课程' : '编辑课程'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={mode === 'create' ? '创建' : '保存'}
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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
            <InputNumber className="!w-full" min={1} max={500} placeholder="1-500，留空表示不限制" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
