import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  DatePicker,
  Form,
  Input,
  Radio,
  Segmented,
  Select,
  Switch,
  Upload,
} from 'antd'
import dayjs from 'dayjs'
import { courseService } from '@/features/courses/services/course.service'
import { courseResourceService } from '@/features/courses/services/course-resource.service'
import { questionBankService } from '@/features/question-bank/services/question-bank.service'
import type { QuestionBankItem, QuestionType } from '@/features/question-bank/types/question-bank'
import type { CourseSummary } from '@/features/courses/types/course'
import type { TaskDetail, TaskFormValues, TaskType } from '@/features/tasks/types/task'
import {
  supportsQuestionSelection,
  taskTypeOptions,
} from '@/features/tasks/components/task-form/constants'
import {
  type AttachmentUploadFile,
  toUploadFileList,
  uploadAttachments,
} from '@/features/tasks/components/task-form/attachments'
import TaskQuestionSelectionSection from '@/features/tasks/components/task-form/TaskQuestionSelectionSection'
import TaskQuestionPickerModal from '@/features/tasks/components/task-form/TaskQuestionPickerModal'
import { uiMessage } from '@/shared/components/feedback/message'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'

interface TaskFormCardProps {
  mode: 'create' | 'edit'
  task?: TaskDetail | null
  courses: CourseSummary[]
  submitting?: boolean
  enableDraftQuestionSelection?: boolean
  onSubmit: (values: TaskFormValues, questionBankIds?: string[]) => Promise<void>
  onCancel: () => void
}

export default function TaskFormCard({
  mode,
  task,
  courses,
  submitting = false,
  enableDraftQuestionSelection = false,
  onSubmit,
  onCancel,
}: TaskFormCardProps) {
  const [form] = Form.useForm()
  const { isMobile, mobileModalWidth } = useResponsiveLayout()
  const [uploading, setUploading] = useState(false)
  const [attachmentFileList, setAttachmentFileList] = useState<AttachmentUploadFile[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [questionSearchInput, setQuestionSearchInput] = useState('')
  const [questionSearchKeyword, setQuestionSearchKeyword] = useState('')
  const [questionFilterType, setQuestionFilterType] = useState<QuestionType | 'all'>('all')
  const [draftQuestionRows, setDraftQuestionRows] = useState<QuestionBankItem[]>([])
  const [modalSelectedRowKeys, setModalSelectedRowKeys] = useState<string[]>([])

  const selectedCourseId = Form.useWatch('courseId', form) as string | undefined
  const selectedType = (Form.useWatch('type', form) as TaskType | undefined) ?? 'project'
  const assignmentMode =
    (Form.useWatch('assignmentMode', form) as 'all' | 'selected' | undefined) ?? 'all'
  const shouldPickQuestions =
    enableDraftQuestionSelection && supportsQuestionSelection(selectedType)
  const draftQuestionTotalScore = useMemo(
    () => draftQuestionRows.reduce((sum, item) => sum + item.score, 0),
    [draftQuestionRows],
  )

  const { data: courseStudents } = useQuery({
    queryKey: ['task-form-members', selectedCourseId],
    queryFn: () => courseService.getAllCourseStudents(selectedCourseId!),
    enabled: Boolean(selectedCourseId),
  })

  const { data: resourcesPage } = useQuery({
    queryKey: ['task-form-resources', selectedCourseId],
    queryFn: () =>
      courseResourceService.getCourseResources(selectedCourseId!, { page: 1, pageSize: 100 }),
    enabled: Boolean(selectedCourseId),
  })

  const { data: bankPage, isLoading: isBankLoading } = useQuery({
    queryKey: [
      'task-form-question-bank',
      selectedCourseId,
      questionSearchKeyword,
      questionFilterType,
      isPickerOpen,
    ],
    queryFn: () =>
      questionBankService.getQuestionBank({
        page: 1,
        pageSize: 100,
        courseId: selectedCourseId,
        search: questionSearchKeyword || undefined,
        type: questionFilterType === 'all' ? undefined : questionFilterType,
      }),
    enabled: isPickerOpen && Boolean(selectedCourseId) && shouldPickQuestions,
  })

  const studentOptions = useMemo(
    () =>
      (courseStudents ?? [])
        .filter((item) => item.user?.role === 'student')
        .map((item) => ({
          label: item.user?.fullName || item.user?.username || '未命名学生',
          value: item.userId,
        })),
    [courseStudents],
  )

  const resourceOptions = useMemo(
    () =>
      (resourcesPage?.items ?? []).map((item) => ({
        label: item.title,
        value: item.id,
      })),
    [resourcesPage],
  )

  const availableQuestionRows = useMemo(() => {
    const currentIds = new Set(draftQuestionRows.map((item) => item.id))
    return (bankPage?.items ?? []).map((item) => ({
      ...item,
      alreadyAdded: currentIds.has(item.id),
    }))
  }, [bankPage?.items, draftQuestionRows])

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
      setDraftQuestionRows([])
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

  useEffect(() => {
    if (!shouldPickQuestions) {
      setDraftQuestionRows([])
      setModalSelectedRowKeys([])
    }
  }, [shouldPickQuestions])

  useEffect(() => {
    setDraftQuestionRows([])
    setModalSelectedRowKeys([])
  }, [selectedCourseId])

  const handleFinish = async (values: Record<string, unknown>) => {
    if (shouldPickQuestions && draftQuestionRows.length === 0) {
      uiMessage.warning('作业和测验必须先选择题目')
      return
    }

    if (shouldPickQuestions && draftQuestionTotalScore !== 100) {
      uiMessage.warning(`当前题目总分为 ${draftQuestionTotalScore} 分，请调整到 100 分后再提交`)
      return
    }

    setUploading(true)
    try {
      const attachments = await uploadAttachments(attachmentFileList)
      const isPublishedValue =
        typeof values.isPublished === 'boolean' ? values.isPublished : true

      await onSubmit(
        {
          courseId: String(values.courseId),
          title: String(values.title).trim(),
          description: String(values.description || '').trim(),
          type: values.type as TaskType,
          dueDate: dayjs(values.dueDate as dayjs.Dayjs).toISOString(),
          totalScore: 100,
          passingScore: 60,
          assignmentMode: values.assignmentMode as 'all' | 'selected',
          assignedStudentIds:
            values.assignmentMode === 'selected'
              ? ((values.assignedStudentIds as string[] | undefined) ?? [])
              : [],
          relatedResourceIds:
            values.type === 'reading'
              ? ((values.relatedResourceIds as string[] | undefined) ?? [])
              : [],
          isPublished: isPublishedValue,
          attachments,
        },
        shouldPickQuestions ? draftQuestionRows.map((item) => item.id) : undefined,
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <section className="app-panel overflow-hidden border border-[rgba(28,25,23,0.06)] bg-white">
        <Form form={form} layout="vertical" onFinish={handleFinish} className="space-y-0">
          <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6 xl:px-7">
            <div className="grid gap-4 lg:grid-cols-2">
              <Form.Item
                label="所属课程"
                name="courseId"
                rules={[{ required: true, message: '请选择课程' }]}
                className="!mb-0"
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
                className="!mb-0"
              >
                <Segmented block options={taskTypeOptions} />
              </Form.Item>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Form.Item
                label="任务标题"
                name="title"
                rules={[{ required: true, message: '请输入任务标题' }]}
                className="!mb-0"
              >
                <Input placeholder="输入任务标题" maxLength={100} />
              </Form.Item>
            </div>

            <Form.Item label="任务说明" name="description" className="!mb-0">
              <Input.TextArea rows={4} placeholder="补充任务要求" maxLength={4000} />
            </Form.Item>

            <div className="grid gap-4 lg:grid-cols-3">
              <Form.Item
                label="截止时间"
                name="dueDate"
                rules={[{ required: true, message: '请选择截止时间' }]}
                className="!mb-0"
              >
                <DatePicker showTime className="w-full" />
              </Form.Item>

              <Form.Item label="分配范围" name="assignmentMode" className="!mb-0">
                <Radio.Group optionType="button" buttonStyle="solid" className="w-full">
                  <Radio.Button value="all">全班</Radio.Button>
                  <Radio.Button value="selected">定向</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="发布状态" className="!mb-0">
                <div className="flex h-[54px] items-center rounded-[14px] border border-[rgba(28,25,23,0.08)] px-4">
                  <Form.Item name="isPublished" valuePropName="checked" noStyle>
                    <Switch checkedChildren="发布" unCheckedChildren="草稿" />
                  </Form.Item>
                </div>
              </Form.Item>
            </div>

            {shouldPickQuestions ? (
              <TaskQuestionSelectionSection
                selectedCourseId={selectedCourseId}
                draftQuestionRows={draftQuestionRows}
                onOpenPicker={() => {
                  setModalSelectedRowKeys(draftQuestionRows.map((item) => item.id))
                  setIsPickerOpen(true)
                }}
                onRemoveQuestion={(questionId) => {
                  setDraftQuestionRows((current) =>
                    current.filter((item) => item.id !== questionId),
                  )
                }}
              />
            ) : null}

            {assignmentMode === 'selected' ? (
              <Form.Item
                label="指定学生"
                name="assignedStudentIds"
                rules={[{ required: true, message: '请至少选择一名学生' }]}
                className="!mb-0"
              >
                <Select
                  mode="multiple"
                  placeholder="选择学生"
                  options={studentOptions}
                  loading={Boolean(selectedCourseId) && !courseStudents}
                />
              </Form.Item>
            ) : null}

            {selectedType === 'reading' ? (
              <Form.Item label="关联资源" name="relatedResourceIds" className="!mb-0">
                <Select
                  mode="multiple"
                  placeholder="选择资源"
                  options={resourceOptions}
                  loading={Boolean(selectedCourseId) && !resourcesPage}
                />
              </Form.Item>
            ) : null}

            <Form.Item label="任务附件" className="!mb-0">
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
                  setAttachmentFileList((current) =>
                    current.filter((item) => item.uid !== file.uid),
                  )
                }}
              >
                <Button>选择附件</Button>
              </Upload>
            </Form.Item>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-[rgba(28,25,23,0.06)] bg-white/92 px-5 py-4 backdrop-blur sm:px-6 xl:px-7">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button onClick={onCancel}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting || uploading}>
                {mode === 'create' ? '创建任务' : '保存修改'}
              </Button>
            </div>
          </div>
        </Form>
      </section>

      <TaskQuestionPickerModal
        open={isPickerOpen}
        isMobile={isMobile}
        mobileModalWidth={mobileModalWidth}
        selectedCourseId={selectedCourseId}
        isBankLoading={isBankLoading}
        availableQuestionRows={availableQuestionRows}
        questionSearchInput={questionSearchInput}
        setQuestionSearchInput={setQuestionSearchInput}
        setQuestionSearchKeyword={setQuestionSearchKeyword}
        questionFilterType={questionFilterType}
        setQuestionFilterType={setQuestionFilterType}
        modalSelectedRowKeys={modalSelectedRowKeys}
        setModalSelectedRowKeys={setModalSelectedRowKeys}
        onCancel={() => setIsPickerOpen(false)}
        onConfirm={() => {
          const selectedSet = new Set(modalSelectedRowKeys)
          const merged = new Map(draftQuestionRows.map((item) => [item.id, item]))
          for (const item of bankPage?.items ?? []) {
            if (selectedSet.has(item.id)) {
              merged.set(item.id, item)
            }
          }
          const nextRows = Array.from(merged.values())
          const nextTotalScore = nextRows.reduce((sum, item) => sum + item.score, 0)
          setDraftQuestionRows(nextRows)
          setIsPickerOpen(false)
          if (nextTotalScore !== 100) {
            uiMessage.warning(`当前题目总分为 ${nextTotalScore} 分，请继续调整到 100 分`)
          }
        }}
      />
    </>
  )
}
