import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Popconfirm,
  Table,
  Tag,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import TaskQuestionList from '@/features/tasks/components/TaskQuestionList'
import { taskService } from '@/features/tasks/services/task.service'
import type {
  GradeTaskSubmissionPayload,
  TaskDetail,
  TaskFile,
  TaskQuestion,
  TaskSubmission,
} from '@/features/tasks/types/task'
import { uploadService } from '@/shared/api/upload.service'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDate, formatDateTime, getDueDateClass } from '@/shared/utils/date'

type AttachmentUploadFile = UploadFile & { taskFile?: TaskFile }

function supportsQuestionPreview(taskType: TaskDetail['type']) {
  return taskType === 'homework' || taskType === 'quiz'
}

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

    if (!file.originFileObj) {
      continue
    }

    const uploaded = await uploadService.uploadSingle(file.originFileObj, 'attachment')
    result.push({
      key: uploaded.key,
      url: uploaded.url,
      originalName: uploaded.originalName,
      size: uploaded.size,
      mimeType: uploaded.mimeType,
      name: file.originFileObj.name,
    })
  }

  return result
}

export default function TaskDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isTeacherView = currentUser?.role === 'teacher' || currentUser?.role === 'admin'

  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionPageSize, setSubmissionPageSize] = useState(10)
  const [gradingTarget, setGradingTarget] = useState<TaskSubmission | null>(null)
  const [gradeForm] = Form.useForm()

  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.getTaskById(id),
    enabled: Boolean(id),
  })

  const shouldLoadQuestions = Boolean(task && supportsQuestionPreview(task.type))

  const { data: taskQuestions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['task-questions', id],
    queryFn: () => taskService.getTaskQuestions(id),
    enabled: shouldLoadQuestions,
  })

  const { data: submission, isLoading: isSubmissionLoading } = useQuery({
    queryKey: ['task-submission', id],
    queryFn: () => taskService.getCurrentSubmission(id),
    enabled: Boolean(id) && !isTeacherView,
  })

  const { data: submissionsPage, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['task-submissions', id, submissionPage, submissionPageSize],
    queryFn: () => taskService.getTaskSubmissions(id, submissionPage, submissionPageSize),
    enabled: Boolean(id) && isTeacherView,
  })

  const gradeMutation = useMutation({
    mutationFn: (payload: GradeTaskSubmissionPayload) => taskService.gradeSubmission(id, payload),
    onSuccess: async () => {
      uiMessage.success('评分已保存')
      setGradingTarget(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', id] }),
        queryClient.invalidateQueries({ queryKey: ['task-submissions', id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: () => {
      uiMessage.error('评分失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(id),
    onSuccess: async () => {
      uiMessage.success('任务已删除')
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate('/tasks', { replace: true })
    },
    onError: () => {
      uiMessage.error('删除任务失败')
    },
  })

  const teacherSubmissionColumns = useMemo(
    () => [
      {
        title: '学生',
        dataIndex: 'user',
        key: 'user',
        render: (_value: unknown, record: TaskSubmission) =>
          record.user?.fullName || record.user?.username || '未命名学生',
      },
      {
        title: '提交时间',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (value: TaskSubmission['status']) => (
          <Tag color={value === 'graded' ? 'green' : 'orange'}>
            {value === 'graded' ? '已评分' : '待评分'}
          </Tag>
        ),
      },
      {
        title: '得分',
        dataIndex: 'score',
        key: 'score',
        render: (_value: unknown, record: TaskSubmission) =>
          record.score !== undefined ? `${record.score}/${record.maxScore}` : '-',
      },
      {
        title: '操作',
        key: 'actions',
        render: (_value: unknown, record: TaskSubmission) => (
          <Button
            type="link"
            onClick={() => {
              setGradingTarget(record)
              gradeForm.setFieldsValue({
                score: record.score ?? 0,
                feedback: record.feedback ?? '',
              })
            }}
          >
            {record.status === 'graded' ? '查看评分' : '去评分'}
          </Button>
        ),
      },
    ],
    [gradeForm],
  )

  if (
    (isTaskLoading || (!isTeacherView && isSubmissionLoading) || (isTeacherView && isSubmissionsLoading)) &&
    !task
  ) {
    return <PageLoading />
  }

  if (!task) {
    return <Navigate to="/tasks" replace />
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WorkspaceLayout
        preset="course"
        aside={
          <section className="app-panel px-5 py-5">
            <div className="app-section-heading">
              <h2 className="app-section-title">任务信息</h2>
            </div>
            <Descriptions column={1} size="small" labelStyle={{ color: '#78716c' }}>
              <Descriptions.Item label="所属课程">{task.course?.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="任务类型">
                <Tag color={task.type === 'reading' ? 'purple' : task.type === 'project' ? 'blue' : 'green'}>
                  {task.type === 'homework'
                    ? '作业任务'
                    : task.type === 'quiz'
                      ? '测验任务'
                      : task.type === 'project'
                        ? '项目任务'
                        : '阅读任务'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="截止日期">
                <span className={getDueDateClass(task.dueDate)}>{formatDateTime(task.dueDate)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="总分">{task.totalScore}</Descriptions.Item>
              <Descriptions.Item label="及格分">{task.passingScore}</Descriptions.Item>
              <Descriptions.Item label="分配范围">
                {task.assignmentMode === 'selected' ? '定向任务' : '全班任务'}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-5 rounded-[22px] bg-stone-50 px-4 py-4 text-sm text-stone-600">
              <div>目标学生：{task.assignedStudentCount}</div>
              <div className="mt-2">已提交：{task.submittedCount}</div>
              <div className="mt-2">已评分：{task.gradedCount}</div>
            </div>

            {task.relatedResources.length ? (
              <div className="mt-5">
                <div className="mb-3 text-sm font-medium text-stone-900">推荐资源</div>
                <div className="space-y-2">
                  {task.relatedResources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-[var(--lms-color-border)] px-4 py-3 text-sm text-stone-600 transition hover:border-[rgba(255,107,53,0.18)] hover:text-stone-900"
                    >
                      {resource.title}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {task.attachments.length ? (
              <div className="mt-5">
                <div className="mb-3 text-sm font-medium text-stone-900">任务附件</div>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <a
                      key={attachment.key}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-[var(--lms-color-border)] px-4 py-3 text-sm text-stone-600 transition hover:border-[rgba(255,107,53,0.18)] hover:text-stone-900"
                    >
                      {attachment.name || attachment.originalName}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        }
      >
        <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="text-sm font-medium text-stone-400 transition hover:text-stone-700"
              >
                返回任务中心
              </button>
              <h1 className="mt-4 text-[clamp(28px,3vw,42px)] font-semibold tracking-[-0.04em] text-stone-900">
                {task.title}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-stone-500">
                {task.description || '暂无任务说明。'}
              </p>
            </div>

            {isTeacherView ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(`/tasks/${id}/edit`)}>编辑任务</Button>
                <Popconfirm
                  title="确定删除这条任务吗？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => deleteMutation.mutate()}
                >
                  <Button danger loading={deleteMutation.isPending}>
                    删除任务
                  </Button>
                </Popconfirm>
              </div>
            ) : null}
          </div>
        </section>

        {shouldLoadQuestions ? (
          <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
            <div className="app-section-heading">
              <h2 className="app-section-title">{isTeacherView ? '题目预览' : '任务题目'}</h2>
            </div>
            <div className="mt-4">
              <TaskQuestionList
                questions={taskQuestions}
                loading={isQuestionsLoading}
                showAnswer={isTeacherView}
                emptyText={isTeacherView ? '当前还没有配置题目。' : '老师暂时还没有发布题目内容。'}
              />
            </div>
          </section>
        ) : null}

        {isTeacherView ? (
          <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
            <div className="app-section-heading">
              <h2 className="app-section-title">学生提交</h2>
            </div>

            {submissionsPage && submissionsPage.items.length > 0 ? (
              <>
                <Table<TaskSubmission>
                  rowKey="id"
                  dataSource={submissionsPage.items}
                  columns={teacherSubmissionColumns}
                  pagination={false}
                  scroll={{ x: 720 }}
                />
                <div className="mt-5 flex justify-end">
                  <Pagination
                    current={submissionPage}
                    pageSize={submissionPageSize}
                    total={submissionsPage.total}
                    showSizeChanger
                    onChange={(nextPage, nextPageSize) => {
                      setSubmissionPage(nextPage)
                      setSubmissionPageSize(nextPageSize)
                    }}
                  />
                </div>
              </>
            ) : (
              <Empty description="当前还没有学生提交" />
            )}
          </section>
        ) : (
          <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <Card bordered={false} className="rounded-[24px] bg-stone-50 shadow-none">
                <div className="text-sm font-medium text-stone-900">提交说明</div>
                <div className="mt-3 text-sm leading-7 text-stone-500">
                  {task.type === 'reading'
                    ? '阅读任务建议先浏览老师推荐的资源，再在右侧提交阅读总结或补充材料。'
                    : shouldLoadQuestions
                      ? '请先完成题目内容，再将答案整理到文本说明或附件中提交。后续会继续补充结构化答题体验。'
                      : '项目或作业任务支持提交文本说明和附件材料，提交后老师可以直接查看并评分。'}
                </div>
                {submission?.status === 'graded' ? (
                  <div className="mt-5 rounded-[20px] bg-white px-4 py-4">
                    <div className="text-sm text-stone-500">评分结果</div>
                    <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                      {submission.score ?? 0} / {submission.maxScore}
                    </div>
                    {submission.feedback ? (
                      <div className="mt-3 text-sm leading-7 text-stone-500">{submission.feedback}</div>
                    ) : null}
                  </div>
                ) : null}
              </Card>

              <Card bordered={false} className="rounded-[24px] bg-white shadow-none">
                <StudentSubmissionPanel
                  key={submission?.id ?? `draft-${id}`}
                  task={task}
                  submission={submission}
                  taskQuestions={taskQuestions}
                  onSubmit={async (values) => {
                    await taskService.submitTask(id, values)
                    uiMessage.success('任务提交成功')
                    await Promise.all([
                      queryClient.invalidateQueries({ queryKey: ['task', id] }),
                      queryClient.invalidateQueries({ queryKey: ['task-submission', id] }),
                      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
                    ])
                  }}
                />
              </Card>
            </div>
          </section>
        )}
      </WorkspaceLayout>

      <Modal
        open={Boolean(gradingTarget)}
        title={gradingTarget ? `评分：${gradingTarget.user?.fullName || gradingTarget.user?.username || '学生'}` : '评分'}
        okText="保存评分"
        cancelText="取消"
        okButtonProps={{ loading: gradeMutation.isPending }}
        onCancel={() => setGradingTarget(null)}
        onOk={() => {
          gradeForm
            .validateFields()
            .then((values) =>
              gradeMutation.mutate({
                studentId: gradingTarget!.userId,
                score: Number(values.score),
                feedback: values.feedback,
              }),
            )
            .catch(() => undefined)
        }}
      >
        {gradingTarget ? (
          <div className="space-y-4">
            <div className="rounded-[20px] bg-stone-50 px-4 py-4 text-sm text-stone-600">
              <div>提交时间：{formatDateTime(gradingTarget.submittedAt)}</div>
              {gradingTarget.content ? (
                <div className="mt-3 whitespace-pre-wrap leading-7">{gradingTarget.content}</div>
              ) : null}
            </div>

            {gradingTarget.attachments.length ? (
              <div className="space-y-2">
                {gradingTarget.attachments.map((attachment) => (
                  <a
                    key={attachment.key}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-[var(--lms-color-border)] px-4 py-3 text-sm text-stone-600"
                  >
                    {attachment.name || attachment.originalName}
                  </a>
                ))}
              </div>
            ) : null}

            <Form form={gradeForm} layout="vertical">
              <Form.Item
                label="评分"
                name="score"
                rules={[{ required: true, message: '请输入评分' }]}
              >
                <InputNumber min={0} max={task.totalScore} className="w-full" />
              </Form.Item>
              <Form.Item label="反馈" name="feedback">
                <Input.TextArea rows={4} placeholder="给学生的反馈建议" />
              </Form.Item>
            </Form>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

interface StudentSubmissionPanelProps {
  task: TaskDetail
  submission: TaskSubmission | null | undefined
  taskQuestions: TaskQuestion[]
  onSubmit: (values: { content?: string; attachments: TaskFile[] }) => Promise<void>
}

function StudentSubmissionPanel({
  task,
  submission,
  taskQuestions,
  onSubmit,
}: StudentSubmissionPanelProps) {
  const [content, setContent] = useState(submission?.content ?? '')
  const [fileList, setFileList] = useState<AttachmentUploadFile[]>(toUploadFileList(submission?.attachments ?? []))
  const [uploading, setUploading] = useState(false)

  const canEditSubmission = submission?.status !== 'graded'
  const showQuestionTip = supportsQuestionPreview(task.type) && taskQuestions.length > 0

  const submitMutation = useMutation({
    mutationFn: async () => {
      const attachments = await uploadAttachments(fileList)
      await onSubmit({
        content: content.trim() || undefined,
        attachments,
      })
    },
    onMutate: () => setUploading(true),
    onError: () => {
      uiMessage.error('任务提交失败')
    },
    onSettled: () => setUploading(false),
  })

  return (
    <Form layout="vertical" onFinish={() => submitMutation.mutate()}>
      {showQuestionTip ? (
        <div className="mb-4 rounded-[20px] bg-stone-50 px-4 py-4 text-sm leading-7 text-stone-500">
          当前共有 {taskQuestions.length} 道题目。你可以先完成题目，再把答案整理到下方文本说明或附件中提交。
        </div>
      ) : null}

      <Form.Item label="文本说明">
        <Input.TextArea
          rows={8}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="输入提交说明、项目总结或题目答案整理"
          disabled={!canEditSubmission}
        />
      </Form.Item>
      <Form.Item label="提交附件">
        <Upload
          multiple
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList((current) => [
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
            setFileList((current) => current.filter((item) => item.uid !== file.uid))
          }}
          disabled={!canEditSubmission}
        >
          <Button disabled={!canEditSubmission}>选择附件</Button>
        </Upload>
      </Form.Item>
      <div className="flex items-center justify-between text-sm text-stone-400">
        <span>截止日期：{formatDate(task.dueDate)}</span>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitMutation.isPending || uploading}
          disabled={!canEditSubmission}
        >
          {submission ? '重新提交' : '提交任务'}
        </Button>
      </div>
    </Form>
  )
}
