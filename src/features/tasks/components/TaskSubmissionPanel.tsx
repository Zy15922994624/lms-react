import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, Checkbox, Form, Input, Radio, Tag, Upload } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import type {
  TaskDetail,
  TaskFile,
  TaskQuestion,
  TaskQuestionType,
  TaskSubmission,
  TaskSubmissionAnswer,
  TaskSubmissionValues,
} from '@/features/tasks/types/task'
import { uploadService } from '@/shared/api/upload.service'
import { uiMessage } from '@/shared/components/feedback/message'
import { formatDate, formatDateTime } from '@/shared/utils/date'

type AttachmentUploadFile = UploadFile & { taskFile?: TaskFile }
type QuestionAnswerInput = string | string[] | null
type AnswerValueMap = Record<string, QuestionAnswerInput>

interface TaskSubmissionPanelProps {
  task: TaskDetail
  submission: TaskSubmission | null | undefined
  taskQuestions: TaskQuestion[]
  onSubmit: (values: TaskSubmissionValues) => Promise<void>
}

const questionTypeLabelMap: Record<TaskQuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

function supportsQuestionAnswering(taskType: TaskDetail['type']) {
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

function getSubmissionAnswer(submission: TaskSubmission | null | undefined, questionId: string) {
  return submission?.answers.find((item) => item.questionId === questionId)
}

function getQuestionScore(answer?: TaskSubmissionAnswer) {
  return answer?.manualScore ?? answer?.autoScore ?? 0
}

function normalizeAnswerInput(answer: unknown, type: TaskQuestionType): QuestionAnswerInput {
  if (type === 'multi_choice') {
    return Array.isArray(answer) ? answer.map((item) => String(item)) : []
  }

  if (answer === null || answer === undefined) {
    return null
  }

  return String(answer)
}

function normalizeAnswerOutput(value: QuestionAnswerInput, type: TaskQuestionType) {
  if (type === 'multi_choice') {
    return Array.isArray(value) ? value.filter(Boolean) : []
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized || null
}

function buildInitialAnswerValues(
  submission: TaskSubmission | null | undefined,
  taskQuestions: TaskQuestion[],
) {
  return Object.fromEntries(
    taskQuestions.map((question) => [
      question.id,
      normalizeAnswerInput(getSubmissionAnswer(submission, question.id)?.answer, question.type),
    ]),
  )
}

function getQuestionScoreText(score: number, totalScore: number) {
  return ` ${score} / ${totalScore}`
}

export default function TaskSubmissionPanel({
  task,
  submission,
  taskQuestions,
  onSubmit,
}: TaskSubmissionPanelProps) {
  const [content, setContent] = useState(submission?.content ?? '')
  const [fileList, setFileList] = useState<AttachmentUploadFile[]>(
    toUploadFileList(submission?.attachments ?? []),
  )
  const [answerValues, setAnswerValues] = useState<AnswerValueMap>(() =>
    buildInitialAnswerValues(submission, taskQuestions),
  )
  const [uploading, setUploading] = useState(false)

  const canEditSubmission = submission?.status !== 'graded'
  const showQuestionSheet = supportsQuestionAnswering(task.type) && taskQuestions.length > 0
  const isReadingTask = task.type === 'reading'
  const contentLabel = isReadingTask ? '读后感' : '补充说明'
  const contentPlaceholder = isReadingTask
    ? '请结合阅读内容填写你的读后感'
    : '补充提交说明或备注'
  const submitButtonText = submission ? '重新提交' : isReadingTask ? '提交读后感' : '提交任务'

  const submitMutation = useMutation({
    mutationFn: async () => {
      const attachments = await uploadAttachments(fileList)
      const answers = showQuestionSheet
        ? taskQuestions.map((question) => ({
            questionId: question.id,
            answer: normalizeAnswerOutput(answerValues[question.id] ?? null, question.type),
          }))
        : undefined

      await onSubmit({
        content: content.trim() || undefined,
        attachments,
        answers,
      })
    },
    onMutate: () => setUploading(true),
    onError: () => {
      uiMessage.error('任务提交失败')
    },
    onSettled: () => setUploading(false),
  })

  const updateAnswerValue = (questionId: string, nextValue: QuestionAnswerInput) => {
    setAnswerValues((current) => ({
      ...current,
      [questionId]: nextValue,
    }))
  }

  return (
    <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
      {submission ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[18px] border border-[rgba(28,25,23,0.08)] bg-stone-50 px-4 py-3 text-sm text-stone-500">
          <Tag color={submission.status === 'graded' ? 'green' : 'orange'}>
            {submission.status === 'graded' ? '已评分' : '已提交'}
          </Tag>
          <span>最近提交：{formatDateTime(submission.submittedAt)}</span>
          {submission.status === 'graded' ? (
            <span className="font-medium text-stone-900">
              当前得分：{submission.score ?? 0} / {submission.maxScore}
            </span>
          ) : (
            <span className="font-medium text-stone-900">等待教师评分</span>
          )}
        </div>
      ) : null}

      <Form layout="vertical" onFinish={() => submitMutation.mutate()}>
        {showQuestionSheet ? (
          <div className="space-y-4">
            {taskQuestions.map((question, index) => {
              const answer = getSubmissionAnswer(submission, question.id)
              const currentValue = answerValues[question.id] ?? null

              return (
                <article
                  key={question.id}
                  className="rounded-[18px] border border-[rgba(28,25,23,0.08)] bg-stone-50/70 px-4 py-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Tag color="blue">{questionTypeLabelMap[question.type]}</Tag>
                    <span className="text-xs text-stone-400">第 {index + 1} 题</span>
                    <span className="text-xs text-stone-400">分值：{question.score} 分</span>
                  </div>
                  <h3 className="text-base font-semibold text-stone-900">{question.title}</h3>
                  {question.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-500">
                      {question.description}
                    </p>
                  ) : null}

                  {question.type === 'single_choice' ? (
                    <div className="mt-4">
                      <Radio.Group
                        value={typeof currentValue === 'string' ? currentValue : undefined}
                        onChange={(event) => updateAnswerValue(question.id, event.target.value)}
                        disabled={!canEditSubmission}
                      >
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <Radio key={option.key} value={option.key}>
                              {option.key}. {option.label}
                            </Radio>
                          ))}
                        </div>
                      </Radio.Group>
                    </div>
                  ) : null}

                  {question.type === 'multi_choice' ? (
                    <div className="mt-4">
                      <Checkbox.Group
                        value={Array.isArray(currentValue) ? currentValue : []}
                        onChange={(values) =>
                          updateAnswerValue(
                            question.id,
                            values.map((item) => String(item)),
                          )
                        }
                        disabled={!canEditSubmission}
                      >
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <Checkbox key={option.key} value={option.key}>
                              {option.key}. {option.label}
                            </Checkbox>
                          ))}
                        </div>
                      </Checkbox.Group>
                    </div>
                  ) : null}

                  {question.type === 'fill_text' ? (
                    <Input
                      className="mt-4"
                      value={typeof currentValue === 'string' ? currentValue : ''}
                      onChange={(event) => updateAnswerValue(question.id, event.target.value)}
                      placeholder="请输入答案"
                      disabled={!canEditSubmission}
                    />
                  ) : null}

                  {question.type === 'rich_text' ? (
                    <Input.TextArea
                      className="mt-4"
                      rows={5}
                      value={typeof currentValue === 'string' ? currentValue : ''}
                      onChange={(event) => updateAnswerValue(question.id, event.target.value)}
                      placeholder="请输入作答内容"
                      disabled={!canEditSubmission}
                    />
                  ) : null}

                  {submission?.status === 'graded' ? (
                    <div className="mt-4 rounded-[16px] bg-white px-4 py-3 text-sm text-stone-600">
                      <div>
                        本题得分：
                        <span className="font-semibold text-stone-900">
                          {getQuestionScoreText(getQuestionScore(answer), question.score)}
                        </span>
                      </div>
                      {answer?.comments ? (
                        <div className="mt-2 whitespace-pre-wrap leading-7">{answer.comments}</div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : null}

        <Form.Item className={showQuestionSheet ? 'mt-6' : undefined} label={contentLabel}>
          <Input.TextArea
            rows={5}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={contentPlaceholder}
            disabled={!canEditSubmission}
          />
        </Form.Item>

        <Form.Item label="附件">
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

        {submission?.feedback ? (
          <div className="mb-5 rounded-[18px] border border-[rgba(28,25,23,0.08)] bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-600">
            {submission.feedback}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 text-sm text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <span>截止日期：{formatDate(task.dueDate)}</span>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitMutation.isPending || uploading}
            disabled={!canEditSubmission}
          >
            {submitButtonText}
          </Button>
        </div>
      </Form>
    </section>
  )
}
