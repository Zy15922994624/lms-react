import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import { courseService } from '@/features/courses/services/course.service'
import { courseResourceService } from '@/features/courses/services/course-resource.service'
import type { CourseSummary } from '@/features/courses/types/course'
import type { TaskDetail, TaskFile, TaskFormValues, TaskType } from '@/features/tasks/types/task'
import { uploadService } from '@/shared/api/upload.service'
import { uiMessage } from '@/shared/components/feedback/message'

interface TaskFormCardProps {
  mode: 'create' | 'edit'
  task?: TaskDetail | null
  courses: CourseSummary[]
  submitting?: boolean
  onSubmit: (values: TaskFormValues) => Promise<void>
  onCancel: () => void
}

type AttachmentUploadFile = UploadFile & { taskFile?: TaskFile }

const taskTypeOptions: Array<{ label: string; value: TaskType }> = [
  { label: '作业任务', value: 'homework' },
  { label: '测验任务', value: 'quiz' },
  { label: '项目任务', value: 'project' },
  { label: '阅读任务', value: 'reading' },
]

function toUploadFileList(attachments: TaskFile[] = []): AttachmentUploadFile[] {
  return attachments.map((attachment, index) => ({
    uid: `${attachment.key}-${index}`,
    name: attachment.name || attachment.originalName,
    status: 'done',
    url: attachment.url,
    taskFile: attachment,
  }))
}

async function uploadAttachments(files: AttachmentUploadFile[]) {
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

export default function TaskFormCard({
  mode,
  task,
  courses,
  submitting = false,
  onSubmit,
  onCancel,
}: TaskFormCardProps) {
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [attachmentFileList, setAttachmentFileList] = useState<AttachmentUploadFile[]>([])

  const selectedCourseId = Form.useWatch('courseId', form) as string | undefined
  const selectedType = (Form.useWatch('type', form) as TaskType | undefined) ?? 'project'
  const assignmentMode = (Form.useWatch('assignmentMode', form) as 'all' | 'selected' | undefined) ?? 'all'

  const { data: membersPage } = useQuery({
    queryKey: ['task-form-members', selectedCourseId],
    queryFn: () => courseService.getCourseMembers(selectedCourseId!, 1, 200),
    enabled: Boolean(selectedCourseId),
  })

  const { data: resourcesPage } = useQuery({
    queryKey: ['task-form-resources', selectedCourseId],
    queryFn: () => courseResourceService.getCourseResources(selectedCourseId!, { page: 1, pageSize: 100 }),
    enabled: Boolean(selectedCourseId),
  })

  const studentOptions = useMemo(
    () =>
      (membersPage?.items ?? [])
        .filter((item) => item.user?.role === 'student')
        .map((item) => ({
          label: item.user?.fullName || item.user?.username || '未命名学生',
          value: item.userId,
        })),
    [membersPage],
  )

  const resourceOptions = useMemo(
    () =>
      (resourcesPage?.items ?? []).map((item) => ({
        label: item.title,
        value: item.id,
      })),
    [resourcesPage],
  )

  useEffect(() => {
    if (!task) {
      form.setFieldsValue({
        courseId: undefined,
        title: '',
        description: '',
        type: 'project',
        dueDate: dayjs().add(7, 'day'),
        totalScore: 100,
        passingScore: 60,
        assignmentMode: 'all',
        assignedStudentIds: [],
        relatedResourceIds: [],
        isPublished: true,
      })
      setAttachmentFileList([])
      return
    }

    form.setFieldsValue({
      courseId: task.courseId,
      title: task.title,
      description: task.description,
      type: task.type,
      dueDate: dayjs(task.dueDate),
      totalScore: task.totalScore,
      passingScore: task.passingScore,
      assignmentMode: task.assignmentMode,
      assignedStudentIds: [],
      relatedResourceIds: task.relatedResourceIds,
      isPublished: task.isPublished,
    })
    setAttachmentFileList(toUploadFileList(task.attachments))
  }, [form, task])

  useEffect(() => {
    if (selectedType !== 'reading') {
      form.setFieldValue('relatedResourceIds', [])
    }
  }, [form, selectedType])

  useEffect(() => {
    if (assignmentMode !== 'selected') {
      form.setFieldValue('assignedStudentIds', [])
    }
  }, [assignmentMode, form])

  const handleFinish = async (values: Record<string, unknown>) => {
    setUploading(true)
    try {
      const attachments = await uploadAttachments(attachmentFileList)
      await onSubmit({
        courseId: String(values.courseId),
        title: String(values.title).trim(),
        description: String(values.description || '').trim(),
        type: values.type as TaskType,
        dueDate: dayjs(values.dueDate as dayjs.Dayjs).toISOString(),
        totalScore: Number(values.totalScore),
        passingScore: Number(values.passingScore),
        assignmentMode: values.assignmentMode as 'all' | 'selected',
        assignedStudentIds:
          values.assignmentMode === 'selected'
            ? ((values.assignedStudentIds as string[] | undefined) ?? [])
            : [],
        relatedResourceIds:
          values.type === 'reading'
            ? ((values.relatedResourceIds as string[] | undefined) ?? [])
            : [],
        isPublished: Boolean(values.isPublished),
        attachments,
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="rounded-[28px] border border-[var(--lms-color-border)] bg-white/96 shadow-[0_20px_48px_rgba(28,25,23,0.06)]">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="grid gap-4 lg:grid-cols-2"
      >
        <Form.Item
          label="所属课程"
          name="courseId"
          rules={[{ required: true, message: '请选择课程' }]}
          className="lg:col-span-1"
        >
          <Select
            placeholder="选择课程"
            options={courses.map((course) => ({
              label: course.title,
              value: course.id,
            }))}
            disabled={mode === 'edit'}
          />
        </Form.Item>

        <Form.Item
          label="任务类型"
          name="type"
          rules={[{ required: true, message: '请选择任务类型' }]}
          className="lg:col-span-1"
        >
          <Select options={taskTypeOptions} />
        </Form.Item>

        <Form.Item
          label="任务标题"
          name="title"
          rules={[{ required: true, message: '请输入任务标题' }]}
          className="lg:col-span-2"
        >
          <Input placeholder="输入任务标题" maxLength={100} />
        </Form.Item>

        <Form.Item label="任务描述" name="description" className="lg:col-span-2">
          <Input.TextArea rows={5} placeholder="补充任务要求、提交说明或评分标准" maxLength={4000} />
        </Form.Item>

        <Form.Item
          label="截止时间"
          name="dueDate"
          rules={[{ required: true, message: '请选择截止时间' }]}
        >
          <DatePicker showTime className="w-full" />
        </Form.Item>

        <Form.Item label="发布状态" name="isPublished" valuePropName="checked">
          <Switch checkedChildren="已发布" unCheckedChildren="未发布" />
        </Form.Item>

        <Form.Item
          label="任务总分"
          name="totalScore"
          rules={[{ required: true, message: '请输入任务总分' }]}
        >
          <InputNumber min={0} max={1000} className="w-full" />
        </Form.Item>

        <Form.Item
          label="及格分"
          name="passingScore"
          rules={[
            { required: true, message: '请输入及格分' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value === undefined || value <= getFieldValue('totalScore')) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('及格分不能高于总分'))
              },
            }),
          ]}
        >
          <InputNumber min={0} max={1000} className="w-full" />
        </Form.Item>

        <Form.Item label="分配范围" name="assignmentMode" className="lg:col-span-2">
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio.Button value="all">全班任务</Radio.Button>
            <Radio.Button value="selected">定向任务</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {assignmentMode === 'selected' ? (
          <Form.Item
            label="指定学生"
            name="assignedStudentIds"
            rules={[{ required: true, message: '请至少选择一名学生' }]}
            className="lg:col-span-2"
          >
            <Select
              mode="multiple"
              placeholder="选择本次任务可见的学生"
              options={studentOptions}
              loading={Boolean(selectedCourseId) && !membersPage}
            />
          </Form.Item>
        ) : null}

        {selectedType === 'reading' ? (
          <Form.Item label="推荐资源" name="relatedResourceIds" className="lg:col-span-2">
            <Select
              mode="multiple"
              placeholder="为阅读任务选择推荐资源"
              options={resourceOptions}
              loading={Boolean(selectedCourseId) && !resourcesPage}
            />
          </Form.Item>
        ) : null}

        <Form.Item label="任务附件" className="lg:col-span-2">
          <Upload
            multiple
            fileList={attachmentFileList}
            beforeUpload={(file) => {
              setAttachmentFileList((current) => [
                ...current,
                {
                  uid: `${file.uid}-${Date.now()}`,
                  name: file.name,
                  status: 'done',
                  originFileObj: file,
                },
              ])
              return false
            }}
            onRemove={(file) => {
              setAttachmentFileList((current) => current.filter((item) => item.uid !== file.uid))
            }}
          >
            <Button>选择附件</Button>
          </Upload>
          <div className="mt-2 text-xs leading-6 text-stone-400">
            任务保存时才会真正上传附件，这样可以避免产生无效文件。
          </div>
        </Form.Item>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 lg:col-span-2">
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting || uploading}
            onClick={() => {
              if (assignmentMode === 'selected' && !selectedCourseId) {
                uiMessage.warning('请先选择课程，再指定学生')
              }
            }}
          >
            {mode === 'create' ? '创建任务' : '保存修改'}
          </Button>
        </div>
      </Form>
    </Card>
  )
}
