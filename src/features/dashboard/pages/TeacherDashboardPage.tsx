import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'

const teacherMetrics = [
  { label: '进行中课程', value: '12', hint: '含本周任务班级', tone: 'primary' },
  { label: '待批改提交', value: '36', hint: '优先处理', tone: 'warning' },
  { label: '本周通知', value: '8', hint: '课程公告', tone: 'neutral' },
]

const teacherAgenda = [
  { title: '完成《Web 开发基础》任务批改', meta: '截止 18:00 · 共 18 份提交' },
  { title: '发布《数据库设计》章节任务', meta: '二年级 3 班' },
  { title: '检查两个课程空间的资源更新', meta: '避免学生端资料版本不一致' },
]

const teacherHighlights = [
  { title: '本周重点', value: '4 门课程进入集中推进', note: '优先查看三年级课程安排' },
  { title: '班级反馈', value: '2 个班级需要补充说明', note: '任务要求和评分标准待同步' },
]

export default function TeacherDashboardPage() {
  const agendaAside = (
    <div className={`app-panel ${workspacePanelPadding.asideWarm}`}>
      <div className="app-section-heading">
        <h2 className="app-section-title">待处理事项</h2>
      </div>

      <div className="space-y-3">
        {teacherAgenda.map((item, index) => (
          <div
            key={item.title}
            className="rounded-[20px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lms-color-primary-soft)] text-sm font-semibold text-orange-600">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-6 text-stone-900">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-stone-500">{item.meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="app-page">
      <WorkspaceLayout
        preset="dashboard"
        aside={agendaAside}
        mainClassName={`app-panel ${workspacePanelPadding.hero}`}
      >
        <div className="app-page-header">
          <h1 className="app-page-title max-w-4xl 2xl:max-w-5xl">教学工作台</h1>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 2xl:gap-5">
          {teacherMetrics.map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-[var(--lms-color-border)] bg-white/92 px-5 py-5 shadow-[0_12px_30px_rgba(28,25,23,0.05)] 2xl:px-6 2xl:py-6"
            >
              <div className="text-sm text-stone-500">{item.label}</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {item.value}
              </div>
              <div
                className={`mt-3 text-xs leading-5 ${
                  item.tone === 'primary'
                    ? 'text-orange-600'
                    : item.tone === 'warning'
                      ? 'text-amber-600'
                      : 'text-stone-500'
                }`}
              >
                {item.hint}
              </div>
            </div>
          ))}
        </div>
      </WorkspaceLayout>

      <section className="grid gap-6 xl:grid-cols-2 2xl:gap-8">
        {teacherHighlights.map((item) => (
          <div
            key={item.title}
            className="app-panel px-6 py-5 sm:px-7 xl:px-8 xl:py-6 2xl:px-9"
          >
            <div className="text-sm font-medium text-stone-500">{item.title}</div>
            <div className="mt-3 text-xl font-semibold tracking-[-0.02em] text-stone-900">
              {item.value}
            </div>
            <div className="mt-2 text-sm leading-6 text-stone-500">{item.note}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
