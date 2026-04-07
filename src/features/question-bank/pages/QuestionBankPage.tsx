import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Dropdown,
  Input,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { DownOutlined, DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
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

const questionTypeBackgroundMap: Record<QuestionType, string> = {
  single_choice: 'bg-emerald-50 text-emerald-700',
  multi_choice: 'bg-orange-50 text-orange-700',
  fill_text: 'bg-violet-50 text-violet-700',
  rich_text: 'bg-sky-50 text-sky-700',
}

const questionBankHeroPadding = 'px-5 py-4 sm:px-6 sm:py-5 xl:px-7 xl:py-5 2xl:px-8 2xl:py-6'
const questionBankSectionPadding = 'px-5 py-5 sm:px-6 sm:py-5 xl:px-7 xl:py-6 2xl:px-8'
const questionBankAsidePadding = 'px-4 py-4 xl:px-5 xl:py-5 2xl:px-6 2xl:py-5'

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

  const importMenu = {
    items: [
      {
        key: 'template',
        label: '下载模板',
        icon: <DownloadOutlined />,
      },
      {
        key: 'create',
        label: '手动录入',
        icon: <PlusOutlined />,
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'create') {
        openCreateModal()
        return
      }
      void handleDownloadTemplate()
    },
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await questionBankService.downloadTemplate()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = '题库导入模板.xlsx'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      uiMessage.error('模板下载失败')
    }
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
        mainClassName="space-y-5 2xl:space-y-6"
        aside={
          <section
            className={`${questionBankAsidePadding} rounded-[26px] border border-[var(--lms-color-border)] bg-white/96 shadow-[0_20px_48px_rgba(28,25,23,0.07)]`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-stone-500">题型分布</div>
              <div className="text-sm text-stone-500">
                {selectedCourse ? selectedCourse.title : '全部课程'} · {total} 题
              </div>
            </div>
            <div className="mt-3 space-y-2.5 text-sm text-stone-700">
              {(['single_choice', 'multi_choice', 'fill_text', 'rich_text'] as QuestionType[]).map(
                (type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-2.5"
                  >
                    <span>{questionTypeTextMap[type]}</span>
                    <strong className="text-stone-950">{currentPageTypeCountMap[type]}</strong>
                  </div>
                ),
              )}
            </div>
          </section>
        }
      >
        <section
          className={`${questionBankHeroPadding} rounded-[30px] border border-[rgba(255,107,53,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,251,247,0.96)_100%)] shadow-[0_24px_60px_rgba(28,25,23,0.07)]`}
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0 w-full space-y-2">
                <h1 className="text-[clamp(2.1rem,2.7vw,3rem)] font-semibold leading-[1.05] tracking-[-0.05em] text-stone-950 md:whitespace-nowrap">
                  题库管理
                </h1>
                <div className="text-base text-stone-500">共 {total} 题</div>
              </div>
              <Space.Compact size="large" className="shrink-0 md:justify-self-end">
                <Button type="primary" size="large" onClick={() => setIsImportModalOpen(true)}>
                  <span className="inline-flex items-center gap-2">
                    <UploadOutlined />
                    Excel 导入
                  </span>
                </Button>
                <Dropdown trigger={['click']} menu={importMenu}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownOutlined />}
                    aria-label="更多导入操作"
                  />
                </Dropdown>
              </Space.Compact>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
              <Input.Search
                allowClear
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onSearch={handleSearch}
                placeholder="搜索题目"
                className="w-full"
              />
              <Select
                value={selectedCourseId}
                onChange={(value) => {
                  setCurrentPage(1)
                  setSelectedCourseId(value)
                }}
                className="w-full"
                options={[
                  { label: '全部课程', value: 'all' },
                  ...courses.map((course: CourseSummary) => ({
                    label: course.title,
                    value: course.id,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {(['single_choice', 'multi_choice', 'fill_text', 'rich_text'] as QuestionType[]).map(
                (type) => {
                  const selected = selectedType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`rounded-2xl px-3 py-1.5 text-sm transition ${selected ? 'bg-[var(--lms-color-primary)] text-white shadow-[0_10px_20px_rgba(255,107,53,0.18)]' : questionTypeBackgroundMap[type]}`}
                      onClick={() => {
                        setCurrentPage(1)
                        setSelectedType(selected ? 'all' : type)
                      }}
                    >
                      {questionTypeTextMap[type]}
                    </button>
                  )
                },
              )}
            </div>
          </div>
        </section>

        <section
          className={`${questionBankSectionPadding} rounded-[28px] border border-[var(--lms-color-border)] bg-white/96 shadow-[0_20px_48px_rgba(28,25,23,0.07)]`}
        >
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
