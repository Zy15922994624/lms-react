import { useMemo, type Dispatch, type SetStateAction } from 'react'
import { Input, Modal, Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import type { QuestionBankItem, QuestionType } from '@/features/question-bank/types/question-bank'
import { questionTypeLabelMap } from '@/features/tasks/components/task-form/constants'

interface PickerQuestionRow extends QuestionBankItem {
  alreadyAdded: boolean
}

interface TaskQuestionPickerModalProps {
  open: boolean
  isMobile: boolean
  mobileModalWidth: number | string
  selectedCourseId?: string
  isBankLoading: boolean
  availableQuestionRows: PickerQuestionRow[]
  questionSearchInput: string
  setQuestionSearchInput: Dispatch<SetStateAction<string>>
  setQuestionSearchKeyword: Dispatch<SetStateAction<string>>
  questionFilterType: QuestionType | 'all'
  setQuestionFilterType: Dispatch<SetStateAction<QuestionType | 'all'>>
  modalSelectedRowKeys: string[]
  setModalSelectedRowKeys: Dispatch<SetStateAction<string[]>>
  onCancel: () => void
  onConfirm: () => void
}

export default function TaskQuestionPickerModal({
  open,
  isMobile,
  mobileModalWidth,
  selectedCourseId,
  isBankLoading,
  availableQuestionRows,
  questionSearchInput,
  setQuestionSearchInput,
  setQuestionSearchKeyword,
  questionFilterType,
  setQuestionFilterType,
  modalSelectedRowKeys,
  setModalSelectedRowKeys,
  onCancel,
  onConfirm,
}: TaskQuestionPickerModalProps) {
  const pickerColumns = useMemo<TableColumnsType<PickerQuestionRow>>(
    () => [
      {
        title: '题目',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-stone-900">{value}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-400">
              <span>{questionTypeLabelMap[record.type]}</span>
              <span>分值：{record.score}</span>
            </div>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Modal
      open={open}
      title="添加题目"
      width={isMobile ? mobileModalWidth : 880}
      okText="加入列表"
      cancelText="取消"
      onCancel={onCancel}
      onOk={onConfirm}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <Input.Search
          placeholder="搜索题目"
          value={questionSearchInput}
          onChange={(event) => setQuestionSearchInput(event.target.value)}
          onSearch={(value) => setQuestionSearchKeyword(value.trim())}
          allowClear
        />
        <Select
          className="md:w-40"
          value={questionFilterType}
          options={[
            { label: '全部题型', value: 'all' },
            { label: '单选题', value: 'single_choice' },
            { label: '多选题', value: 'multi_choice' },
            { label: '填空题', value: 'fill_text' },
            { label: '简答题', value: 'rich_text' },
          ]}
          onChange={(value) => setQuestionFilterType(value)}
        />
      </div>

      <Table<PickerQuestionRow>
        rowKey="id"
        size="small"
        loading={isBankLoading}
        dataSource={availableQuestionRows}
        columns={pickerColumns}
        pagination={false}
        rowSelection={{
          selectedRowKeys: modalSelectedRowKeys,
          onChange: (nextKeys) => setModalSelectedRowKeys(nextKeys.map(String)),
          preserveSelectedRowKeys: true,
        }}
        locale={{ emptyText: selectedCourseId ? '当前课程下没有可选题目' : '请先选择课程' }}
        scroll={{ x: 640 }}
      />

      <div className="mt-3 text-xs text-stone-400">已选 {modalSelectedRowKeys.length} 题</div>
    </Modal>
  )
}
