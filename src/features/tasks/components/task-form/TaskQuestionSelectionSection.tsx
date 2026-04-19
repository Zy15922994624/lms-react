import { useMemo } from 'react'
import { Button, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { QuestionBankItem } from '@/features/question-bank/types/question-bank'
import { questionTypeLabelMap } from '@/features/tasks/components/task-form/constants'
import { uiMessage } from '@/shared/components/feedback/message'

interface TaskQuestionSelectionSectionProps {
  selectedCourseId?: string
  draftQuestionRows: QuestionBankItem[]
  onOpenPicker: () => void
  onRemoveQuestion: (questionId: string) => void
}

export default function TaskQuestionSelectionSection({
  selectedCourseId,
  draftQuestionRows,
  onOpenPicker,
  onRemoveQuestion,
}: TaskQuestionSelectionSectionProps) {
  const draftQuestionColumns = useMemo<TableColumnsType<QuestionBankItem>>(
    () => [
      {
        title: '题目',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Tag>{questionTypeLabelMap[record.type]}</Tag>
              <span className="text-xs text-stone-400">分值：{record.score} 分</span>
            </div>
            <div className="text-sm font-medium text-stone-900">{value}</div>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 88,
        render: (_value, record) => (
          <Button size="small" danger type="text" onClick={() => onRemoveQuestion(record.id)}>
            移除
          </Button>
        ),
      },
    ],
    [onRemoveQuestion],
  )

  return (
    <section className="rounded-[20px] border border-[rgba(255,107,53,0.14)] bg-[rgba(255,107,53,0.04)] px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button
          type="primary"
          onClick={() => {
            if (!selectedCourseId) {
              uiMessage.warning('请先选择课程，再添加题目')
              return
            }
            onOpenPicker()
          }}
        >
          添加题目
        </Button>
      </div>

      <div className="mt-4">
        <Table<QuestionBankItem>
          rowKey="id"
          size="small"
          dataSource={draftQuestionRows}
          columns={draftQuestionColumns}
          pagination={false}
          locale={{ emptyText: '请先添加题目' }}
          scroll={{ x: 520 }}
        />
      </div>
    </section>
  )
}
