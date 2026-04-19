import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Form } from 'antd'
import dayjs from 'dayjs'
import type { CourseSummary } from '@/features/courses/types/course'
import { courseService } from '@/features/courses/services/course.service'
import { courseResourceService } from '@/features/courses/services/course-resource.service'
import { questionBankService } from '@/features/question-bank/services/question-bank.service'
import type { QuestionBankItem, QuestionType } from '@/features/question-bank/types/question-bank'
import type { TaskDetail, TaskFormValues, TaskType } from '@/features/tasks/types/task'
import { supportsQuestionSelection } from '@/features/tasks/components/task-form/constants'
import TaskFormAdvancedSection from '@/features/tasks/components/task-form/TaskFormAdvancedSection'
import {
  type AttachmentUploadFile,
  toUploadFileList,
  uploadAttachments,
} from '@/features/tasks/components/task-form/attachments'
import TaskFormBaseSection from '@/features/tasks/components/task-form/TaskFormBaseSection'
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
      const isPublishedValue = typeof values.isPublished === 'boolean' ? values.isPublished : true

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
            <TaskFormBaseSection mode={mode} courses={courses} />

            <TaskFormAdvancedSection
              shouldPickQuestions={shouldPickQuestions}
              selectedCourseId={selectedCourseId}
              draftQuestionRows={draftQuestionRows}
              assignmentMode={assignmentMode}
              selectedType={selectedType}
              studentOptions={studentOptions}
              resourceOptions={resourceOptions}
              hasCourseStudents={Boolean(courseStudents)}
              hasResourcesPage={Boolean(resourcesPage)}
              attachmentFileList={attachmentFileList}
              setAttachmentFileList={setAttachmentFileList}
              onOpenPicker={() => {
                setModalSelectedRowKeys(draftQuestionRows.map((item) => item.id))
                setIsPickerOpen(true)
              }}
              onRemoveQuestion={(questionId) => {
                setDraftQuestionRows((current) => current.filter((item) => item.id !== questionId))
              }}
            />
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
