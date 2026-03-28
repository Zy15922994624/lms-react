export default function TeacherDashboardPage() {
  return (
    <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(28,25,23,0.06)] sm:px-6">
      <div className="text-xs uppercase tracking-[0.2em] text-stone-400">Workspace</div>
      <h1 className="mt-3 text-2xl font-semibold text-stone-900 sm:text-[28px]">
        教学工作台
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
        这里会逐步承接课程概览、任务发布、批改提醒和班级动态，作为教师端的核心操作入口。
      </p>
    </div>
  )
}
