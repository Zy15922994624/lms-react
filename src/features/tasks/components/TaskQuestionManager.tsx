import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Modal, Select, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { questionBankService } from '@/features/question-bank/services/question-bank.service'
import type {
  QuestionBankItem,
  QuestionType,
} from '@/features/question-bank/types/question-bank'
import { taskService } from '@/features/tasks/services/task.service'
import type { TaskDetail } from '@/features/tasks/types/task'
import { uiMessage } from '@/shared/components/feedback/message'
import TaskQuestionList from './TaskQuestionList'

interface TaskQuestionManagerProps {
  task: TaskDetail
}

const questionTypeTextMap: Record<QuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

function supportsQuestionDesign(taskType: TaskDetail['type']) {
  return taskType === 'homework' || taskType === 'quiz'
}

export default function TaskQuestionManager({ task }: TaskQuestionManagerProps) {
  const queryClient = useQueryClient()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const canConfigureQuestions = supportsQuestionDesign(task.type)

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['task-questions', task.id],
    queryFn: () => taskService.getTaskQuestions(task.id),
    enabled: canConfigureQuestions,
  })

  const { data: bankPage, isLoading: isBankLoading } = useQuery({
    queryKey: ['task-question-picker', task.id, searchKeyword, selectedType],
    queryFn: () =>
      questionBankService.getQuestionBank({
        page: 1,
        pageSize: 100,
        search: searchKeyword || undefined,
        type: selectedType === 'all' ? undefined : selectedType,
        courseId: task.courseId,
      }),
    enabled: isPickerOpen && canConfigureQuestions,
  })

  const orderedQuestions = useMemo(
    () =>
      [...questions].sort((left, right) =>
        left.order === right.order
          ? left.createdAt.localeCompare(right.createdAt)
          : left.order - right.order,
      ),
    [questions],
  )
  const questionTotalScore = useMemo(
    () => orderedQuestions.reduce((sum, item) => sum + item.score, 0),
    [orderedQuestions],
  )
  const isQuestionScoreValid = questionTotalScore === 100

  const addMutation = useMutation({
    mutationFn: (questionBankIds: string[]) =>
      taskService.addTaskQuestionsFromBank(task.id, { questionBankIds }),
    onSuccess: async () => {
      uiMessage.success('题目已加入任务')
      setSelectedRowKeys([])
      setIsPickerOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task-questions', task.id] }),
        queryClient.invalidateQueries({ queryKey: ['task', task.id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: () => {
      uiMessage.error('加入任务失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => taskService.deleteTaskQuestion(questionId),
    onMutate: (questionId) => {
      setActionLoadingId(questionId)
    },
    onSuccess: async () => {
      uiMessage.success('题目已删除')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task-questions', task.id] }),
        queryClient.invalidateQueries({ queryKey: ['task', task.id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: () => {
      uiMessage.error('删除题目失败')
    },
    onSettled: () => {
      setActionLoadingId(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (questionOrders: Array<{ questionId: string; order: number }>) =>
      taskService.reorderTaskQuestions(task.id, { questionOrders }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task-questions', task.id] }),
        queryClient.invalidateQueries({ queryKey: ['task', task.id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: () => {
      uiMessage.error('更新题目顺序失败')
    },
    onSettled: () => {
      setActionLoadingId(null)
    },
  })

  const availableQuestions = useMemo(() => {
    const currentIds = new Set(orderedQuestions.map((item) => item.questionBankId).filter(Boolean))
    return (bankPage?.items ?? []).map((item) => ({
      ...item,
      alreadyAdded: currentIds.has(item.id),
    }))
  }, [bankPage?.items, orderedQuestions])

  const pickerColumns: TableColumnsType<QuestionBankItem & { alreadyAdded: boolean }> = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      render: (_value, item) => (
        <div className="min-w-0 py-1">
          <div className="truncate text-sm font-medium text-stone-900" title={item.title}>
            {item.title}
          </div>
          {item.description ? (
            <div className="truncate text-xs text-stone-500" title={item.description}>
              {item.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: QuestionType) => <Tag>{questionTypeTextMap[type]}</Tag>,
    },
    {
      title: '分值',
      dataIndex: 'score',
      key: 'score',
      width: 90,
    },
    {
      title: '状态',
      key: 'alreadyAdded',
      width: 120,
      render: (_value, item) =>
        item.alreadyAdded ? <Tag color="blue">已加入</Tag> : <Tag color="default">可添加</Tag>,
    },
  ]

  const handleMove = async (questionId: string, direction: -1 | 1) => {
    const currentIndex = orderedQuestions.findIndex((item) => item.id === questionId)
    const targetIndex = currentIndex + direction

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedQuestions.length) {
      return
    }

    const nextQuestions = [...orderedQuestions]
    const [currentQuestion] = nextQuestions.splice(currentIndex, 1)
    nextQuestions.splice(targetIndex, 0, currentQuestion)

    setActionLoadingId(questionId)
    await reorderMutation.mutateAsync(
      nextQuestions.map((item, index) => ({
        questionId: item.id,
        order: index,
      })),
    )
  }

  if (!canConfigureQuestions) return null

  return (
    <>
      <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="app-section-heading !mb-0">
            <h2 className="app-section-title">选题</h2>
            <p className={`mt-2 text-sm ${isQuestionScoreValid ? 'text-stone-500' : 'text-rose-500'}`}>
              当前题目合计 {questionTotalScore}/100 分
              {isQuestionScoreValid ? '' : '，请继续调整'}
            </p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsPickerOpen(true)}>
            从题库添加
          </Button>
        </div>

        <div className="mt-5">
          <TaskQuestionList
            questions={orderedQuestions}
            loading={isLoading}
            showAnswer
            emptyText="还没有题目。"
            onMoveUp={(questionId) => void handleMove(questionId, -1)}
            onMoveDown={(questionId) => void handleMove(questionId, 1)}
            onDelete={(questionId) => void deleteMutation.mutateAsync(questionId)}
            actionLoadingId={actionLoadingId}
          />
        </div>
      </section>

      <Modal
        open={isPickerOpen}
        title="从题库选择题目"
        width={920}
        okText="加入任务"
        cancelText="取消"
        okButtonProps={{
          disabled: !selectedRowKeys.length,
          loading: addMutation.isPending,
        }}
        onCancel={() => {
          setIsPickerOpen(false)
          setSelectedRowKeys([])
        }}
        onOk={() => addMutation.mutate(selectedRowKeys.map(String))}
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <Input.Search
            placeholder="搜索题干或说明"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => setSearchKeyword(value.trim())}
            allowClear
          />
          <Select
            className="md:w-44"
            value={selectedType}
            options={[
              { label: '全部题型', value: 'all' },
              { label: '单选题', value: 'single_choice' },
              { label: '多选题', value: 'multi_choice' },
              { label: '填空题', value: 'fill_text' },
              { label: '简答题', value: 'rich_text' },
            ]}
            onChange={(value) => setSelectedType(value)}
          />
        </div>

        {availableQuestions.length ? (
          <Table<QuestionBankItem & { alreadyAdded: boolean }>
            rowKey="id"
            pagination={false}
            loading={isBankLoading}
            dataSource={availableQuestions}
            columns={pickerColumns}
            rowSelection={{
              selectedRowKeys,
              onChange: (nextKeys) => setSelectedRowKeys(nextKeys.map(String)),
              getCheckboxProps: (record) => ({
                disabled: record.alreadyAdded,
              }),
            }}
            scroll={{ x: 720 }}
          />
        ) : (
          <Empty description="当前课程下没有可选题目" />
        )}
      </Modal>
    </>
  )
}
