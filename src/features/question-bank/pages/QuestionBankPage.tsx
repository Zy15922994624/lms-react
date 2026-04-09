import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  Pagination,
  Popconfirm,
  Select,
  Segmented,
  Spin,
  Table,
  Tag,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { courseService } from '@/features/courses/services/course.service'
import type { CourseSummary } from '@/features/courses/types/course'
import QuestionBankFormModal from '@/features/question-bank/components/QuestionBankFormModal'
import QuestionBankImportModal from '@/features/question-bank/components/QuestionBankImportModal'
import { questionBankService } from '@/features/question-bank/services/question-bank.service'
import type {
  QuestionBankFormValues,
  QuestionBankItem,
  QuestionType,
} from '@/features/question-bank/types/question-bank'
import { uiMessage } from '@/shared/components/feedback/message'
import PageLoading from '@/shared/components/feedback/PageLoading'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDateTime } from '@/shared/utils/date'

const questionTypeTextMap: Record<QuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

const questionTypeColorMap: Record<QuestionType, string> = {
  single_choice: 'green',
  multi_choice: 'orange',
  fill_text: 'purple',
  rich_text: 'blue',
}

function summarizeTypeCount(items: QuestionBankItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.type] += 1
      return acc
    },
    {
      single_choice: 0,
      multi_choice: 0,
      fill_text: 0,
      rich_text: 0,
    } satisfies Record<QuestionType, number>,
  )
}

function mapFormValuesToPayload(values: QuestionBankFormValues) {
  return {
    title: values.title,
    description: values.description,
    type: values.type,
    courseId: values.courseId,
    options: values.options,
    answer: values.answer,
    analysis: values.analysis,
    score: values.score,
  }
}

export default function QuestionBankPage() {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all')
  const [selectedCourseId, setSelectedCourseId] = useState<string | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null)

  const { data: coursesPage, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['question-bank-courses'],
    queryFn: () => courseService.getCourses(true, 1, 100),
  })

  const {
    data: questionPage,
    isLoading: isQuestionLoading,
    isFetching: isQuestionFetching,
  } = useQuery({
    queryKey: [
      'question-bank',
      currentPage,
      pageSize,
      searchKeyword,
      selectedType,
      selectedCourseId,
    ],
    queryFn: () =>
      questionBankService.getQuestionBank({
        page: currentPage,
        pageSize,
        search: searchKeyword || undefined,
        type: selectedType === 'all' ? undefined : selectedType,
        courseId: selectedCourseId === 'all' ? undefined : selectedCourseId,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (values: QuestionBankFormValues) =>
      questionBankService.createQuestion(mapFormValuesToPayload(values)),
    onSuccess: async () => {
      uiMessage.success('题目已创建')
      setIsModalOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['question-bank'] })
    },
    onError: () => {
      uiMessage.error('创建题目失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: QuestionBankFormValues) =>
      questionBankService.updateQuestion(editingQuestion!.id, mapFormValuesToPayload(values)),
    onSuccess: async () => {
      uiMessage.success('题目已更新')
      setEditingQuestion(null)
      setIsModalOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['question-bank'] })
    },
    onError: () => {
      uiMessage.error('更新题目失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => questionBankService.deleteQuestion(questionId),
    onSuccess: async () => {
      uiMessage.success('题目已删除')
      await queryClient.invalidateQueries({ queryKey: ['question-bank'] })
    },
    onError: () => {
      uiMessage.error('删除题目失败')
    },
  })

  const courses = useMemo(() => coursesPage?.items ?? [], [coursesPage])
  const questions = useMemo(() => questionPage?.items ?? [], [questionPage])
  const total = questionPage?.total ?? 0
  const currentPageTypeCountMap = useMemo(() => summarizeTypeCount(questions), [questions])
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  )

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
          {/* {question.description ? (
            <div className="truncate text-sm leading-6 text-stone-500" title={question.description}>
              {question.description}
            </div>
          ) : null} */}
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
          <Button type="link" size="small" onClick={() => openEditModal(question)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这道题目吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => deleteMutation.mutate(question.id)}
          >
            <Button type="link" size="small" danger loading={deleteMutation.isPending}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  const handleSearch = (value: string) => {
    setCurrentPage(1)
    setSearchKeyword(value.trim())
  }

  const handleSubmit = async (values: QuestionBankFormValues) => {
    if (editingQuestion) {
      await updateMutation.mutateAsync(values)
      return
    }
    await createMutation.mutateAsync(values)
  }

  const openCreateModal = () => {
    setEditingQuestion(null)
    setIsModalOpen(true)
  }

  const openEditModal = (question: QuestionBankItem) => {
    setEditingQuestion(question)
    setIsModalOpen(true)
  }

  const isBusy = isCoursesLoading || isQuestionLoading

  if (isBusy && !courses.length && !questions.length) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WorkspaceLayout
        preset="dashboard"
        mainClassName="app-panel overflow-hidden"
        aside={
          <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-stone-900">题型统计</h2>
              <div className="text-sm text-stone-500">{selectedCourse ? selectedCourse.title : '全部课程'}</div>
            </div>
            <div className="mt-4 space-y-2.5">
              {(['single_choice', 'multi_choice', 'fill_text', 'rich_text'] as QuestionType[]).map(
                (type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-3 text-sm"
                  >
                    <span className="text-stone-600">{questionTypeTextMap[type]}</span>
                    <strong className="text-stone-900">{currentPageTypeCountMap[type]}</strong>
                  </div>
                ),
              )}
            </div>
          </section>
        }
      >
        <div className="border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:px-9 xl:py-6 2xl:px-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">题库</h1>
              <div className="mt-1 text-sm text-stone-500">共 {total} 道题</div>
            </div>

            <div className="flex flex-col gap-3 xl:w-auto xl:flex-row xl:items-center">
              <Input.Search
                allowClear
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onSearch={handleSearch}
                placeholder="搜索题目"
                className="xl:w-[280px] 2xl:w-[320px]"
              />
              <Select
                value={selectedCourseId}
                onChange={(value) => {
                  setCurrentPage(1)
                  setSelectedCourseId(value)
                }}
                className="xl:w-[220px]"
                options={[
                  { label: '全部课程', value: 'all' },
                  ...courses.map((course: CourseSummary) => ({
                    label: course.title,
                    value: course.id,
                  })),
                ]}
              />
              <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>
                Excel 导入
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                新增题目
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Segmented
              value={selectedType}
              onChange={(value) => {
                setCurrentPage(1)
                setSelectedType(value as QuestionType | 'all')
              }}
              options={[
                { label: '全部', value: 'all' },
                { label: '单选题', value: 'single_choice' },
                { label: '多选题', value: 'multi_choice' },
                { label: '填空题', value: 'fill_text' },
                { label: '简答题', value: 'rich_text' },
              ]}
            />
          </div>
        </div>

        <section className="px-5 py-5 sm:px-6 sm:py-5 xl:px-7 xl:py-6 2xl:px-8">
          {isQuestionFetching ? (
            <div className="mb-4 flex justify-end text-stone-400">
              <Spin size="small" />
            </div>
          ) : null}

          <Table<QuestionBankItem>
            rowKey="id"
            dataSource={questions}
            columns={questionColumns}
            pagination={false}
            size="middle"
          />

          {total > 0 ? (
            <div className="mt-8 flex justify-end">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                pageSizeOptions={[10, 20, 50]}
                onChange={(page, nextPageSize) => {
                  setCurrentPage(page)
                  setPageSize(nextPageSize)
                }}
              />
            </div>
          ) : null}
        </section>
      </WorkspaceLayout>

      <QuestionBankFormModal
        open={isModalOpen}
        courses={courses}
        question={editingQuestion}
        submitting={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingQuestion(null)
        }}
        onSubmit={handleSubmit}
      />

      <QuestionBankImportModal
        open={isImportModalOpen}
        courses={courses}
        onCancel={() => setIsImportModalOpen(false)}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ['question-bank'] })
        }}
      />
    </div>
  )
}
