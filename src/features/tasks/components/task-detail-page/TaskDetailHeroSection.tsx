import { Button, Popconfirm, Tag } from 'antd'
import type { TaskDetail } from '@/features/tasks/types/task'
import { formatDateTime, getDueDateClass } from '@/shared/utils/date'
import { getTaskTypeColor, taskTypeLabelMap } from './constants'

interface TaskDetailHeroSectionProps {
  task: TaskDetail
  isTeacherView: boolean
  studentActionText: string
  deleting: boolean
  onBackToList: () => void
  onEditTask: () => void
  onDeleteTask: () => void
  onScrollToSubmission: () => void
}

export default function TaskDetailHeroSection({
  task,
  isTeacherView,
  studentActionText,
  deleting,
  onBackToList,
  onEditTask,
  onDeleteTask,
  onScrollToSubmission,
}: TaskDetailHeroSectionProps) {
  const submissionCountText = `${task.submittedCount}/${task.assignedStudentCount}`

  return (
    <section className="app-panel overflow-hidden">
      <div className="border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:px-9 xl:py-6 2xl:px-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onBackToList}
              className="text-sm font-medium text-stone-400 transition hover:text-stone-700"
            >
              返回任务列表
            </button>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Tag color={getTaskTypeColor(task.type)}>{taskTypeLabelMap[task.type]}</Tag>
              {isTeacherView && !task.isPublished ? <Tag>未发布</Tag> : null}
            </div>

            <h1 className="mt-3 text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.04em] text-stone-950">
              {task.title}
            </h1>

            <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt className="text-stone-400">所属课程</dt>
                <dd className="mt-1 font-medium text-stone-900">{task.course?.title || '-'}</dd>
              </div>
              <div>
                <dt className="text-stone-400">截止时间</dt>
                <dd className={`mt-1 font-medium ${getDueDateClass(task.dueDate)}`}>
                  {formatDateTime(task.dueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-stone-400">总分</dt>
                <dd className="mt-1 font-medium text-stone-900">{task.totalScore} 分</dd>
              </div>
              <div>
                <dt className="text-stone-400">分配范围</dt>
                <dd className="mt-1 font-medium text-stone-900">
                  {task.assignmentMode === 'selected' ? '定向任务' : '全班任务'}
                </dd>
              </div>
            </dl>

            {task.description ? (
              <div className="mt-4 rounded-[16px] bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-600">
                {task.description}
              </div>
            ) : null}
          </div>

          {isTeacherView ? (
            <div className="flex flex-wrap gap-3">
              <Button onClick={onEditTask}>编辑任务</Button>
              <Popconfirm
                title="确认删除这条任务吗？"
                okText="删除"
                cancelText="取消"
                onConfirm={onDeleteTask}
              >
                <Button danger loading={deleting}>
                  删除任务
                </Button>
              </Popconfirm>
            </div>
          ) : (
            <Button type="primary" onClick={onScrollToSubmission}>
              {studentActionText}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:px-8 xl:grid-cols-4 xl:px-9 2xl:px-10">
        <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
          <div className="text-sm text-stone-500">提交情况</div>
          <div className="mt-2 text-2xl font-semibold text-stone-900">{submissionCountText}</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
          <div className="text-sm text-stone-500">已评分</div>
          <div className="mt-2 text-2xl font-semibold text-stone-900">{task.gradedCount}</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
          <div className="text-sm text-stone-500">及格分</div>
          <div className="mt-2 text-2xl font-semibold text-stone-900">{task.passingScore}</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
          <div className="text-sm text-stone-500">发布时间</div>
          <div className="mt-2 text-sm font-medium text-stone-900">
            {task.publishedAt ? formatDateTime(task.publishedAt) : '未发布'}
          </div>
        </div>
      </div>
    </section>
  )
}
