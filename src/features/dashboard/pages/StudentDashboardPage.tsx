export default function StudentDashboardPage() {
  return (
    <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(28,25,23,0.06)] sm:px-6">
      <div className="text-xs uppercase tracking-[0.2em] text-stone-400">Dashboard</div>
      <h1 className="mt-3 text-2xl font-semibold text-stone-900 sm:text-[28px]">
        学生仪表盘
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
        这里会逐步承接学习进度、待完成任务、课程提醒与近期反馈，作为学生端的统一工作入口。
      </p>
    </div>
  )
}
