import { Button, Empty, Popconfirm, Skeleton, Space, Tag } from 'antd'
import type { TaskQuestion, TaskQuestionType } from '@/features/tasks/types/task'

interface TaskQuestionListProps {
  questions?: TaskQuestion[]
  loading?: boolean
  showAnswer?: boolean
  emptyText?: string
  onMoveUp?: (questionId: string) => void
  onMoveDown?: (questionId: string) => void
  onDelete?: (questionId: string) => void
  actionLoadingId?: string | null
}

const questionTypeTextMap: Record<TaskQuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

const questionTypeColorMap: Record<TaskQuestionType, string> = {
  single_choice: 'green',
  multi_choice: 'orange',
  fill_text: 'purple',
  rich_text: 'blue',
}

function formatAnswer(answer: unknown) {
  if (answer === null || answer === undefined || answer === '') {
    return '未设置参考答案'
  }

  if (Array.isArray(answer)) {
    return answer.join('、')
  }

  if (typeof answer === 'object') {
    return JSON.stringify(answer)
  }

  return String(answer)
}

export default function TaskQuestionList({
  questions = [],
  loading = false,
  showAnswer = false,
  emptyText = '当前还没有题目',
  onMoveUp,
  onMoveDown,
  onDelete,
  actionLoadingId = null,
}: TaskQuestionListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton active paragraph={{ rows: 3 }} />
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    )
  }

  if (!questions.length) {
    return <Empty description={emptyText} />
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const isFirst = index === 0
        const isLast = index === questions.length - 1
        const isActionLoading = actionLoadingId === question.id

        return (
          <article
            key={question.id}
            className="rounded-[24px] border border-[var(--lms-color-border)] bg-stone-50/80 px-4 py-4 sm:px-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                    第 {index + 1} 题
                  </span>
                  <Tag color={questionTypeColorMap[question.type]}>
                    {questionTypeTextMap[question.type]}
                  </Tag>
                  <Tag>{question.score} 分</Tag>
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-[-0.02em] text-stone-900">
                  {question.title}
                </h3>
                {question.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-500">
                    {question.description}
                  </p>
                ) : null}
              </div>

              {onMoveUp || onMoveDown || onDelete ? (
                <Space size="small" wrap>
                  {onMoveUp ? (
                    <Button size="small" disabled={isFirst || isActionLoading} onClick={() => onMoveUp(question.id)}>
                      上移
                    </Button>
                  ) : null}
                  {onMoveDown ? (
                    <Button size="small" disabled={isLast || isActionLoading} onClick={() => onMoveDown(question.id)}>
                      下移
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Popconfirm
                      title="确定删除这道题目吗？"
                      okText="删除"
                      cancelText="取消"
                      onConfirm={() => onDelete(question.id)}
                    >
                      <Button size="small" danger loading={isActionLoading}>
                        删除
                      </Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              ) : null}
            </div>

            {question.options.length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => (
                  <div
                    key={`${question.id}-${option.key}`}
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm text-stone-600"
                  >
                    <span className="mr-2 font-medium text-stone-900">{option.key}.</span>
                    {option.label}
                  </div>
                ))}
              </div>
            ) : null}

            {showAnswer ? (
              <div className="mt-4 rounded-[20px] bg-white px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  参考答案
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                  {formatAnswer(question.answer)}
                </div>
                {question.analysis ? (
                  <>
                    <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                      解析
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                      {question.analysis}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
