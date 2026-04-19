import { Button, Pagination, Popconfirm, Spin, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { QuestionBankItem, QuestionType } from '@/features/question-bank/types/question-bank'
import { formatDateTime } from '@/shared/utils/date'
import {
  questionTypeColorMap,
  questionTypeTextMap,
} from '@/features/question-bank/components/question-bank-page/utils'

interface QuestionBankContentProps {
  isMobile: boolean
  isQuestionFetching: boolean
  questions: QuestionBankItem[]
  total: number
  currentPage: number
  pageSize: number
  deleting: boolean
  onOpenEditModal: (question: QuestionBankItem) => void
  onDeleteQuestion: (questionId: string) => void
  onPageChange: (page: number, pageSize: number) => void
}

export default function QuestionBankContent({
  isMobile,
  isQuestionFetching,
  questions,
  total,
  currentPage,
  pageSize,
  deleting,
  onOpenEditModal,
  onDeleteQuestion,
  onPageChange,
}: QuestionBankContentProps) {
  const questionColumns: TableColumnsType<QuestionBankItem> = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      align: 'center',
      ellipsis: { showTitle: false },
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_value, question) => (
        <div className="min-w-0 space-y-1 py-1 text-center">
          <div
            className="truncate text-base font-semibold tracking-[-0.02em] text-stone-950"
            title={question.title}
          >
            {question.title}
          </div>
        </div>
      ),
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'center',
      render: (type: QuestionType) => (
        <Tag color={questionTypeColorMap[type]}>{questionTypeTextMap[type]}</Tag>
      ),
    },
    {
      title: '课程',
      dataIndex: ['course', 'title'],
      key: 'course',
      width: 180,
      align: 'center',
      ellipsis: { showTitle: false },
      render: (_value, question) => (
        <span title={question.course?.title || '—'}>{question.course?.title || '—'}</span>
      ),
    },
    {
      title: '分值',
      dataIndex: 'score',
      key: 'score',
      width: 90,
      align: 'center',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      align: 'center',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_value, question) => (
        <div>
          <Button type="link" size="small" onClick={() => onOpenEditModal(question)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这道题目吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => onDeleteQuestion(question.id)}
          >
            <Button type="link" size="small" danger loading={deleting}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <section className="px-5 py-5 sm:px-6 sm:py-5 xl:px-7 xl:py-6 2xl:px-8">
      {isQuestionFetching ? (
        <div className="mb-4 flex justify-end text-stone-400">
          <Spin size="small" />
        </div>
      ) : null}

      {isMobile ? (
        questions.length ? (
          <div className="space-y-3">
            {questions.map((question) => (
              <article
                key={question.id}
                className="rounded-[16px] border border-[var(--lms-color-border)] bg-white/95 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-base font-semibold text-stone-950">
                      {question.title}
                    </div>
                    <div className="mt-1 text-xs text-stone-500">{question.course?.title || '—'}</div>
                  </div>
                  <Tag color={questionTypeColorMap[question.type]}>{questionTypeTextMap[question.type]}</Tag>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-stone-600">
                  <span>分值 {question.score}</span>
                  <span>{formatDateTime(question.updatedAt)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button type="link" size="small" className="px-0" onClick={() => onOpenEditModal(question)}>
                    编辑
                  </Button>
                  <Popconfirm
                    title="确定删除这道题目吗？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => onDeleteQuestion(question.id)}
                  >
                    <Button type="link" size="small" danger loading={deleting}>
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-stone-400">暂无题目</div>
        )
      ) : (
        <Table<QuestionBankItem>
          rowKey="id"
          dataSource={questions}
          columns={questionColumns}
          pagination={false}
          size="middle"
        />
      )}

      {total > 0 ? (
        <div className={['mt-8 flex', isMobile ? 'justify-center' : 'justify-end'].join(' ')}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            size={isMobile ? 'small' : undefined}
            showSizeChanger={!isMobile}
            pageSizeOptions={[10, 20, 50]}
            onChange={onPageChange}
          />
        </div>
      ) : null}
    </section>
  )
}
