import { Button, Input, Segmented, Select } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import type { CourseSummary } from '@/features/courses/types/course'
import type { QuestionType } from '@/features/question-bank/types/question-bank'

interface QuestionBankToolbarProps {
  total: number
  isMobile: boolean
  searchInput: string
  selectedCourseId: string | 'all'
  selectedType: QuestionType | 'all'
  courses: CourseSummary[]
  onSearchInputChange: (value: string) => void
  onSearch: (value: string) => void
  onCourseChange: (value: string | 'all') => void
  onTypeChange: (value: QuestionType | 'all') => void
  onOpenImportModal: () => void
  onOpenCreateModal: () => void
}

export default function QuestionBankToolbar({
  total,
  isMobile,
  searchInput,
  selectedCourseId,
  selectedType,
  courses,
  onSearchInputChange,
  onSearch,
  onCourseChange,
  onTypeChange,
  onOpenImportModal,
  onOpenCreateModal,
}: QuestionBankToolbarProps) {
  return (
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
            onChange={(event) => onSearchInputChange(event.target.value)}
            onSearch={onSearch}
            placeholder="搜索题目"
            className="xl:w-[280px] 2xl:w-[320px]"
          />
          <Select
            value={selectedCourseId}
            onChange={(value) => onCourseChange(value)}
            className="xl:w-[220px]"
            options={[
              { label: '全部课程', value: 'all' },
              ...courses.map((course: CourseSummary) => ({
                label: course.title,
                value: course.id,
              })),
            ]}
          />
          <Button icon={<UploadOutlined />} onClick={onOpenImportModal}>
            Excel 导入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreateModal}>
            新增题目
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isMobile ? (
          <Select
            value={selectedType}
            onChange={(value) => onTypeChange(value as QuestionType | 'all')}
            className="w-full"
            options={[
              { label: '全部题型', value: 'all' },
              { label: '单选题', value: 'single_choice' },
              { label: '多选题', value: 'multi_choice' },
              { label: '填空题', value: 'fill_text' },
              { label: '简答题', value: 'rich_text' },
            ]}
          />
        ) : (
          <Segmented
            value={selectedType}
            onChange={(value) => onTypeChange(value as QuestionType | 'all')}
            options={[
              { label: '全部', value: 'all' },
              { label: '单选题', value: 'single_choice' },
              { label: '多选题', value: 'multi_choice' },
              { label: '填空题', value: 'fill_text' },
              { label: '简答题', value: 'rich_text' },
            ]}
          />
        )}
      </div>
    </div>
  )
}
