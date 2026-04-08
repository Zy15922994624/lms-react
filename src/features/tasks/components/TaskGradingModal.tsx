import { useMemo } from 'react'
import { Form, Input, InputNumber, Modal, Tag } from 'antd'
import type {
  GradeTaskSubmissionPayload,
  TaskDetail,
  TaskQuestion,
  TaskSubmission,
} from '@/features/tasks/types/task'
import { formatDateTime } from '@/shared/utils/date'

interface TaskGradingModalProps {
  open: boolean
  task: TaskDetail
  submission: TaskSubmission | null
  taskQuestions: TaskQuestion[]
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: GradeTaskSubmissionPayload) => void
}

type GradeFormAnswer = {
  manualScore?: number
  comments?: string
}

const questionTypeTextMap = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
} as const

function supportsQuestionPreview(taskType: TaskDetail['type']) {
  return taskType === 'homework' || taskType === 'quiz'
}

function formatAnswerDisplay(answer: unknown) {
  if (answer === null || answer === undefined || answer === '') {
    return '未作答'
  }

  if (Array.isArray(answer)) {
    return answer.join('、')
  }

  if (typeof answer === 'object') {
    return JSON.stringify(answer)
  }

  return String(answer)
}

function getSubmissionAnswer(submission: TaskSubmission | null, questionId: string) {
  return submission?.answers.find((item) => item.questionId === questionId)
}

function buildGradeFormAnswers(questions: TaskQuestion[], submission: TaskSubmission | null) {
  if (!submission) {
    return []
  }

  return questions.map((question) => {
    const answer = getSubmissionAnswer(submission, question.id)
    return {
      manualScore: answer?.manualScore ?? answer?.autoScore ?? 0,
      comments: answer?.comments ?? '',
    }
  })
}

function calculateDraftScore(
  questions: TaskQuestion[],
  draftAnswers: GradeFormAnswer[] | undefined,
  submission: TaskSubmission | null,
) {
  if (!submission) {
    return 0
  }

  return questions.reduce((total, question, index) => {
    const currentAnswer = getSubmissionAnswer(submission, question.id)
    const score =
      draftAnswers?.[index]?.manualScore ??
      currentAnswer?.manualScore ??
      currentAnswer?.autoScore ??
      0

    return total + Number(score || 0)
  }, 0)
}

export default function TaskGradingModal({
  open,
  task,
  submission,
  taskQuestions,
  loading = false,
  onCancel,
  onSubmit,
}: TaskGradingModalProps) {
  const [form] = Form.useForm()
  const watchedAnswers = Form.useWatch('answers', form) as GradeFormAnswer[] | undefined
  const isQuestionTask = supportsQuestionPreview(task.type) && taskQuestions.length > 0

  const previewScore = useMemo(
    () => calculateDraftScore(taskQuestions, watchedAnswers, submission),
    [submission, taskQuestions, watchedAnswers],
  )

  return (
    <Modal
      open={open}
      title={submission ? `评分：${submission.user?.fullName || submission.user?.username || '学生'}` : '评分'}
      okText="保存评分"
      cancelText="取消"
      width={880}
      okButtonProps={{ loading }}
      afterOpenChange={(visible) => {
        if (visible && submission) {
          form.setFieldsValue({
            score: submission.score ?? 0,
            feedback: submission.feedback ?? '',
            answers: buildGradeFormAnswers(taskQuestions, submission),
          })
          return
        }

        if (!visible) {
          form.resetFields()
        }
      }}
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            const payload: GradeTaskSubmissionPayload = {
              studentId: submission!.userId,
              feedback: values.feedback?.trim() || undefined,
            }

            if (isQuestionTask) {
              payload.answers = taskQuestions.map((question, index) => ({
                questionId: question.id,
                manualScore: values.answers?.[index]?.manualScore,
                comments: values.answers?.[index]?.comments?.trim() || undefined,
              }))
              payload.score = calculateDraftScore(taskQuestions, values.answers, submission)
            } else {
              payload.score = Number(values.score)
            }

            onSubmit(payload)
          })
          .catch(() => undefined)
      }}
    >
      {submission ? (
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[rgba(28,25,23,0.08)] bg-stone-50 px-4 py-3 text-sm text-stone-600">
            <div>提交时间：{formatDateTime(submission.submittedAt)}</div>
            {submission.content ? (
              <div className="mt-2 whitespace-pre-wrap leading-7">{submission.content}</div>
            ) : null}
          </div>

          {submission.attachments.length ? (
            <div className="space-y-2">
              {submission.attachments.map((attachment) => (
                <a
                  key={attachment.key}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[16px] border border-[var(--lms-color-border)] px-4 py-3 text-sm text-stone-600"
                >
                  {attachment.name || attachment.originalName}
                </a>
              ))}
            </div>
          ) : null}

          <Form form={form} layout="vertical">
            {isQuestionTask ? (
              <>
                <div className="rounded-[18px] border border-[rgba(28,25,23,0.08)] bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  当前按题合计得分：
                  <span className="font-semibold text-stone-900"> {previewScore}</span> / {task.totalScore}
                </div>

                <div className="mt-4 space-y-4">
                  {taskQuestions.map((question, index) => {
                    const answer = getSubmissionAnswer(submission, question.id)

                    return (
                      <article
                        key={question.id}
                        className="rounded-[18px] border border-[var(--lms-color-border)] bg-stone-50/70 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag color="blue">{questionTypeTextMap[question.type]}</Tag>
                          <span className="text-xs text-stone-400">{question.score} 分</span>
                          <span className="text-xs text-stone-400">自动分 {answer?.autoScore ?? 0}</span>
                        </div>

                        <h3 className="mt-3 text-base font-semibold text-stone-900">{question.title}</h3>
                        {question.description ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-500">
                            {question.description}
                          </p>
                        ) : null}

                        <div className="mt-4 rounded-[16px] bg-white px-4 py-4">
                          <div className="text-xs font-semibold text-stone-400">学生答案</div>
                          <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                            {formatAnswerDisplay(answer?.answer)}
                          </div>

                          <div className="mt-4 text-xs font-semibold text-stone-400">参考答案</div>
                          <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                            {formatAnswerDisplay(question.answer)}
                          </div>

                          {question.analysis ? (
                            <>
                              <div className="mt-4 text-xs font-semibold text-stone-400">解析</div>
                              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                                {question.analysis}
                              </div>
                            </>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                          <Form.Item
                            label="本题得分"
                            name={['answers', index, 'manualScore']}
                            rules={[{ required: true, message: '请输入本题得分' }]}
                          >
                            <InputNumber min={0} max={question.score} className="w-full" />
                          </Form.Item>
                          <Form.Item label="本题评语" name={['answers', index, 'comments']}>
                            <Input.TextArea rows={3} placeholder="给学生的本题反馈" />
                          </Form.Item>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </>
            ) : (
              <Form.Item
                label="总分"
                name="score"
                rules={[{ required: true, message: '请输入评分' }]}
              >
                <InputNumber min={0} max={task.totalScore} className="w-full" />
              </Form.Item>
            )}

            <Form.Item label="总评语" name="feedback">
              <Input.TextArea rows={4} placeholder="给学生的整体反馈建议" />
            </Form.Item>
          </Form>
        </div>
      ) : null}
    </Modal>
  )
}
