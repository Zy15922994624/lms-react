import { Button, Input, Segmented } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

export type FilterValue = 'all' | 'active' | 'archived'

interface CoursesToolbarProps {
  isStudentView: boolean
  coursesCount: number
  searchKeyword: string
  filter: FilterValue
  canManageCourses: boolean
  onSearchKeywordChange: (value: string) => void
  onFilterChange: (value: FilterValue) => void
  onOpenCreateModal: () => void
}

export default function CoursesToolbar({
  isStudentView,
  coursesCount,
  searchKeyword,
  filter,
  canManageCourses,
  onSearchKeywordChange,
  onFilterChange,
  onOpenCreateModal,
}: CoursesToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:px-9 xl:py-6 2xl:px-10">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">课程</h1>
        <div className="mt-1 text-sm text-stone-500">
          {isStudentView ? `已加入 ${coursesCount} 门课程` : `共 ${coursesCount} 门课程`}
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:w-auto xl:flex-row xl:items-center">
        <Input
          allowClear
          value={searchKeyword}
          onChange={(event) => onSearchKeywordChange(event.target.value)}
          placeholder="搜索课程名、教师或课程代码"
          className="xl:w-[280px] 2xl:w-[320px]"
        />
        <Segmented
          value={filter}
          onChange={(value) => onFilterChange(value as FilterValue)}
          options={[
            { label: '全部', value: 'all' },
            { label: '进行中', value: 'active' },
            { label: '已归档', value: 'archived' },
          ]}
        />
        {canManageCourses ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreateModal}>
            创建课程
          </Button>
        ) : null}
      </div>
    </div>
  )
}
