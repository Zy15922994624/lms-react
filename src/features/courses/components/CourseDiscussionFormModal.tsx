import { Form, Input, Modal } from 'antd'
import type {
  CourseDiscussionFormValues,
  CreateCourseDiscussionPayload,
} from '@/features/courses/types/course-discussion'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'

interface CourseDiscussionFormModalProps {
  open: boolean
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: CreateCourseDiscussionPayload) => Promise<unknown>
}

export default function CourseDiscussionFormModal({
  open,
  loading = false,
  onCancel,
  onSubmit,
}: CourseDiscussionFormModalProps) {
  const [form] = Form.useForm<CourseDiscussionFormValues>()
  const { isMobile, mobileModalWidth } = useResponsiveLayout()

  return (
    <Modal
      open={open}
      title="发起讨论"
      okText="发布"
      cancelText="取消"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      width={isMobile ? mobileModalWidth : undefined}
      afterOpenChange={(visible) => {
        if (!visible) {
          form.resetFields()
        }
      }}
    >
      <Form<CourseDiscussionFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onSubmit}
      >
        <Form.Item
          label="主题"
          name="title"
          rules={[{ required: true, message: '请输入讨论主题' }]}
        >
          <Input placeholder="例如：第二次实验要点" maxLength={120} />
        </Form.Item>

        <Form.Item
          label="内容"
          name="content"
          rules={[{ required: true, message: '请输入讨论内容' }]}
        >
          <Input.TextArea placeholder="输入正文" rows={7} maxLength={5000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
