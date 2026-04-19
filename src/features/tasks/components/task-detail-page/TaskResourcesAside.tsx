import { Empty } from 'antd'
import type { TaskDetail, TaskFile } from '@/features/tasks/types/task'

interface TaskResourcesAsideProps {
  task: TaskDetail
  onDownloadAttachment: (attachment: TaskFile) => void
  onOpenRelatedResource: (resourceId: string) => void
}

export default function TaskResourcesAside({
  task,
  onDownloadAttachment,
  onOpenRelatedResource,
}: TaskResourcesAsideProps) {
  return (
    <section className="app-panel px-4 py-4 sm:px-5 sm:py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
      <div className="app-section-heading">
        <h2 className="app-section-title">附件与资源</h2>
      </div>

      {!task.attachments.length && !task.relatedResources.length ? (
        <div className="mt-4">
          <Empty description="暂无附件或资源" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {task.attachments.length ? (
            <div>
              <div className="mb-2 text-sm font-medium text-stone-900">任务附件</div>
              <div className="space-y-2">
                {task.attachments.map((attachment) => (
                  <button
                    key={attachment.key}
                    type="button"
                    onClick={() => onDownloadAttachment(attachment)}
                    className="block w-full break-all rounded-[16px] border border-[rgba(28,25,23,0.06)] px-4 py-3 text-left text-sm text-stone-700 transition hover:border-[rgba(255,107,53,0.18)] hover:text-orange-600"
                  >
                    {attachment.name || attachment.originalName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {task.relatedResources.length ? (
            <div>
              <div className="mb-2 text-sm font-medium text-stone-900">关联资源</div>
              <div className="space-y-2">
                {task.relatedResources.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => onOpenRelatedResource(resource.id)}
                    className="block w-full break-all rounded-[16px] border border-[rgba(28,25,23,0.06)] px-4 py-3 text-left text-sm text-stone-700 transition hover:border-[rgba(255,107,53,0.18)] hover:text-orange-600"
                  >
                    {resource.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
