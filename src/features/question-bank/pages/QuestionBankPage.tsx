import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courseService } from '@/features/courses/services/course.service'
import QuestionBankFormModal from '@/features/question-bank/components/QuestionBankFormModal'
import QuestionBankImportModal from '@/features/question-bank/components/QuestionBankImportModal'
import QuestionBankContent from '@/features/question-bank/components/question-bank-page/QuestionBankContent'
import QuestionBankStatsAside from '@/features/question-bank/components/question-bank-page/QuestionBankStatsAside'
import QuestionBankToolbar from '@/features/question-bank/components/question-bank-page/QuestionBankToolbar'
import { questionBankService } from '@/features/question-bank/services/question-bank.service'
import type {
  QuestionBankFormValues,
  QuestionBankItem,
  QuestionType,
} from '@/features/question-bank/types/question-bank'
import { mapFormValuesToPayload, summarizeTypeCount } from '@/features/question-bank/components/question-bank-page/utils'
import { uiMessage } from '@/shared/components/feedback/message'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { usePaginationState } from '@/shared/hooks/usePaginationState'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { invalidateQueryKeys } from '@/shared/utils/invalidate-query-keys'

export default function QuestionBankPage() {
  const queryClient = useQueryClient()
  const { isMobile } = useResponsiveLayout()

  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all')
  const [selectedCourseId, setSelectedCourseId] = useState<string | 'all'>('all')
  const {
    page: currentPage,
    setPage: setCurrentPage,
    pageSize,
    handlePageChange,
  } = usePaginationState()
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
      await invalidateQueryKeys(queryClient, [['question-bank']])
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
      await invalidateQueryKeys(queryClient, [['question-bank']])
    },
    onError: () => {
      uiMessage.error('更新题目失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => questionBankService.deleteQuestion(questionId),
    onSuccess: async () => {
      uiMessage.success('题目已删除')
      await invalidateQueryKeys(queryClient, [['question-bank']])
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
          <QuestionBankStatsAside
            selectedCourseTitle={selectedCourse ? selectedCourse.title : '全部课程'}
            currentPageTypeCountMap={currentPageTypeCountMap}
          />
        }
      >
        <QuestionBankToolbar
          total={total}
          isMobile={isMobile}
          searchInput={searchInput}
          selectedCourseId={selectedCourseId}
          selectedType={selectedType}
          courses={courses}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onCourseChange={(value) => {
            setCurrentPage(1)
            setSelectedCourseId(value)
          }}
          onTypeChange={(value) => {
            setCurrentPage(1)
            setSelectedType(value)
          }}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenCreateModal={openCreateModal}
        />

        <QuestionBankContent
          isMobile={isMobile}
          isQuestionFetching={isQuestionFetching}
          questions={questions}
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          deleting={deleteMutation.isPending}
          onOpenEditModal={openEditModal}
          onDeleteQuestion={(questionId) => deleteMutation.mutate(questionId)}
          onPageChange={handlePageChange}
        />
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
          await invalidateQueryKeys(queryClient, [['question-bank']])
        }}
      />
    </div>
  )
}
