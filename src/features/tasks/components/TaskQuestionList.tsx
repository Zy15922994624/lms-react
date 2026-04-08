import { Button, Empty, Popconfirm, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
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
  const columns = useMemo<ColumnsType<TaskQuestion>>(
    () => [
      {
        title: '题号',
        dataIndex: 'order',
        key: 'order',
        width: 72,
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '题目',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Tag color={questionTypeColorMap[record.type]}>{questionTypeTextMap[record.type]}</Tag>
              <span className="text-xs text-stone-400">{record.score} 分</span>
            </div>
            <div className="text-sm font-medium text-stone-900">{value}</div>
            {record.description ? (
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                {record.description}
              </div>
            ) : null}
          </div>
        ),
      },
      ...(onMoveUp || onMoveDown || onDelete
        ? [
            {
              title: '操作',
              key: 'actions',
              width: 180,
              render: (_value: unknown, record: TaskQuestion, index: number) => {
                const isFirst = index === 0
                const isLast = index === questions.length - 1
                const isActionLoading = actionLoadingId === record.id

                return (
                  <Space size="small" wrap>
                    {onMoveUp ? (
                      <Button
                        size="small"
                        disabled={isFirst || isActionLoading}
                        onClick={() => onMoveUp(record.id)}
                      >
                        上移
                      </Button>
                    ) : null}
                    {onMoveDown ? (
                      <Button
                        size="small"
                        disabled={isLast || isActionLoading}
                        onClick={() => onMoveDown(record.id)}
                      >
                        下移
                      </Button>
                    ) : null}
                    {onDelete ? (
                      <Popconfirm
                        title="确定删除这道题目吗？"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => onDelete(record.id)}
                      >
                        <Button size="small" danger loading={isActionLoading}>
                          删除
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Space>
                )
              },
            },
          ]
        : []),
    ],
    [actionLoadingId, onDelete, onMoveDown, onMoveUp, questions.length],
  )

  const expandable = useMemo(
    () => ({
      expandedRowRender: (question: TaskQuestion) => (
        <div className="space-y-4 py-2">
          {question.options.length ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                选项
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => (
                  <div
                    key={`${question.id}-${option.key}`}
                    className="rounded-2xl border border-[var(--lms-color-border)] bg-stone-50 px-4 py-3 text-sm text-stone-600"
                  >
                    <span className="mr-2 font-medium text-stone-900">{option.key}.</span>
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showAnswer ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                参考答案
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                {formatAnswer(question.answer)}
              </div>
            </div>
          ) : null}

          {question.analysis ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                解析
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                {question.analysis}
              </div>
            </div>
          ) : null}
        </div>
      ),
      rowExpandable: (record: TaskQuestion) =>
        record.options.length > 0 || Boolean(showAnswer) || Boolean(record.analysis),
    }),
    [showAnswer],
  )

  if (!questions.length && !loading) {
    return <Empty description={emptyText} />
  }

  return (
    <Table<TaskQuestion>
      rowKey="id"
      dataSource={questions}
      columns={columns}
      loading={loading}
      pagination={false}
      scroll={{ x: 720 }}
      locale={{ emptyText }}
      expandable={expandable}
    />
  )
}
