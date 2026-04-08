import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'

const studentShortcuts = [
  { key: 'tasks', title: '任务中心', description: '查看任务、提交作业与评分反馈。', path: '/tasks' },
  { key: 'courses', title: '课程空间', description: '查看课程信息、资源和讨论内容。', path: '/courses' },
]

const studentNotes = [
  '待办任务和提交状态统一在任务中心查看。',
  '课程资源、成员和讨论信息在课程空间查看。',
  '首页仅保留常用入口，避免和真实业务状态混淆。',
]

export default function StudentDashboardPage() {
  const navigate = useNavigate()

  const aside = (
    <div className={`app-panel ${workspacePanelPadding.asideWarm}`}>
      <div className="app-section-heading">
        <h2 className="app-section-title">常用入口</h2>
      </div>

      <div className="space-y-3">
        {studentShortcuts.map((item) => (
          <div
            key={item.key}
            className="rounded-[20px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4"
          >
            <div className="text-sm font-medium leading-6 text-stone-900">{item.title}</div>
            <div className="mt-1 text-xs leading-5 text-stone-500">{item.description}</div>
            <Button className="mt-4" block onClick={() => navigate(item.path)}>
              进入
            </Button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="app-page">
      <WorkspaceLayout
        preset="dashboard"
        aside={aside}
        mainClassName={`app-panel ${workspacePanelPadding.hero}`}
      >
        <div className="app-page-header">
          <h1 className="app-page-title max-w-4xl 2xl:max-w-5xl">学习工作台</h1>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-[24px] border border-[var(--lms-color-border)] bg-white/92 px-5 py-5 shadow-[0_12px_30px_rgba(28,25,23,0.05)] 2xl:px-6 2xl:py-6">
            <div className="text-sm text-stone-500">页面说明</div>
            <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-900">
              学生常用操作入口
            </div>
            <div className="mt-3 text-sm leading-7 text-stone-500">
              本页仅保留常用入口，请从右侧入口进入具体模块继续操作。
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {studentNotes.map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4 text-sm leading-6 text-stone-600"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </WorkspaceLayout>
    </div>
  )
}
