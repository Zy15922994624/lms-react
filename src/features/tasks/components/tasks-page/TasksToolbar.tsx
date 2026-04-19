import { Button, Input, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { TaskType } from '@/features/tasks/types/task'

interface TasksToolbarProps {
  isTeacherView: boolean
  total: number
  searchText: string
  selectedCourseId?: string
  selectedType?: TaskType
  courseOptions: Array<{ label: string; value: string }>
  taskTypeOptions: Array<{ label: string; value: string }>
  onSearchTextChange: (value: string) => void
  onSearch: (value: string) => void
  onCourseChange: (value?: string) => void
  onTypeChange: (value?: TaskType) => void
  onOpenTaskCreate: () => void
}

export default function TasksToolbar({
  isTeacherView,
  total,
  searchText,
  selectedCourseId,
  selectedType,
  courseOptions,
  taskTypeOptions,
  onSearchTextChange,
  onSearch,
  onCourseChange,
  onTypeChange,
  onOpenTaskCreate,
}: TasksToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:px-9 xl:py-6 2xl:px-10">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">
          {isTeacherView ? '任务' : '我的任务'}
        </h1>
        <div className="mt-1 text-sm text-stone-500">共 {total} 条</div>
      </div>

      <div className="flex flex-col gap-3 xl:w-auto xl:flex-row xl:items-center">
        <Input.Search
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          onSearch={onSearch}
          placeholder="搜索任务标题"
          className="xl:w-[280px] 2xl:w-[320px]"
        />
        <Select
          allowClear
          placeholder="全部课程"
          value={selectedCourseId}
          className="xl:w-[200px]"
          options={courseOptions}
          onChange={onCourseChange}
        />
        <Select
          allowClear
          placeholder="全部类型"
          value={selectedType}
          className="xl:w-[160px]"
          options={taskTypeOptions}
          onChange={(value) => onTypeChange(value as TaskType | undefined)}
        />
        {isTeacherView ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={onOpenTaskCreate}>
            创建任务
          </Button>
        ) : null}
      </div>
    </div>
  )
}
