const studentMetrics = [
  { label: '待完成任务', value: '5', hint: '本周优先', tone: 'warning' },
  { label: '进行中课程', value: '6', hint: '今日课程', tone: 'primary' },
  { label: '最近反馈', value: '3', hint: '教师批改', tone: 'neutral' },
]

const studentAgenda = [
  { title: '完成《算法基础》实验报告', meta: '今晚 20:00 截止' },
  { title: '查看《Web 开发》批改反馈', meta: '已返回成绩与建议' },
  { title: '准备明天课程的资料预习', meta: '数据库设计' },
]

const studentHighlights = [
  { title: '本周安排', value: '2 项重点任务待提交', note: '建议先处理今天截止的实验报告' },
  { title: '学习反馈', value: '最近 3 次作业都有新评语', note: '进入任务中心查看详情' },
]

export default function StudentDashboardPage() {
  return (
    <div className="app-page">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="app-panel px-6 py-6 sm:px-8 sm:py-8">
          <div className="app-page-header">
            <h1 className="app-page-title">学习工作台</h1>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {studentMetrics.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-[var(--lms-color-border)] bg-white/92 px-5 py-5 shadow-[0_12px_30px_rgba(28,25,23,0.05)]"
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
        </div>

        <aside className="app-panel bg-[linear-gradient(180deg,#fff4ec_0%,#fffdfb_100%)] px-5 py-5">
          <div className="app-section-heading">
            <h2 className="app-section-title">待处理事项</h2>
          </div>

          <div className="space-y-3">
            {studentAgenda.map((item, index) => (
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
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {studentHighlights.map((item) => (
          <div
            key={item.title}
            className="app-panel px-6 py-5 sm:px-7"
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
