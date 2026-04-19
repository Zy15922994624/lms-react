import { Button, Tag } from 'antd'
import { DownloadOutlined, PaperClipOutlined } from '@ant-design/icons'
import {
  canPreviewInline,
  formatFileSize,
  getUploaderName,
  resourceTypeMeta,
} from '@/features/courses/constants/course-resource-ui'
import { courseResourceService } from '@/features/courses/services/course-resource.service'
import type { CourseResource } from '@/features/courses/types/course-resource'
import { formatDateTime } from '@/shared/utils/date'

interface CourseResourcesPreviewPanelProps {
  courseId: string
  selectedResource: CourseResource | null
  onOpenImagePreview: () => void
}

export default function CourseResourcesPreviewPanel({
  courseId,
  selectedResource,
  onOpenImagePreview,
}: CourseResourcesPreviewPanelProps) {
  if (!selectedResource) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-[rgba(28,25,23,0.08)] bg-[linear-gradient(180deg,#fffaf6_0%,#fffdfb_100%)] px-6 text-center">
        <div className="max-w-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--lms-color-primary-soft)] text-[var(--lms-color-primary)]">
            <PaperClipOutlined />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-stone-900">选择资源</h3>
        </div>
      </div>
    )
  }

  const typeMeta = resourceTypeMeta[selectedResource.type]

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-[rgba(28,25,23,0.06)] bg-[linear-gradient(180deg,#fffaf6_0%,#fffdfb_100%)]">
        <div className="border-b border-[rgba(28,25,23,0.06)] px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={[
                'inline-flex h-11 w-11 items-center justify-center rounded-2xl text-base',
                typeMeta.iconClassName,
              ].join(' ')}
            >
              {typeMeta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-stone-900">
                  {selectedResource.title}
                </h3>
                <Tag className={`rounded-full border-0 px-3 py-1 ${typeMeta.tagClassName}`}>
                  {typeMeta.label}
                </Tag>
              </div>
              <p className="mt-2 text-sm text-stone-500">{selectedResource.originalFileName}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          {selectedResource.type === 'image' ? (
            <button
              type="button"
              onClick={onOpenImagePreview}
              className="group block w-full cursor-zoom-in overflow-hidden rounded-[24px] bg-stone-100 text-left"
            >
              <img
                src={selectedResource.fileUrl}
                alt={selectedResource.title}
                className="h-[280px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </button>
          ) : null}

          {selectedResource.type === 'video' ? (
            <div className="overflow-hidden rounded-[24px] bg-stone-950">
              <video
                controls
                preload="metadata"
                src={selectedResource.fileUrl}
                className="h-[280px] w-full object-cover"
              />
            </div>
          ) : null}

          {!canPreviewInline(selectedResource) ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[rgba(28,25,23,0.08)] bg-white px-6 text-center">
              <span
                className={[
                  'inline-flex h-14 w-14 items-center justify-center rounded-[20px] text-lg',
                  typeMeta.iconClassName,
                ].join(' ')}
              >
                {typeMeta.icon}
              </span>
              <h4 className="mt-4 text-lg font-semibold text-stone-900">当前资源暂不支持内嵌预览</h4>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    void courseResourceService.downloadCourseResource(courseId, selectedResource)
                  }}
                >
                  下载文件
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 rounded-[24px] bg-white px-4 py-4 text-sm text-stone-600">
            <div className="flex items-center justify-between gap-4">
              <span>上传人</span>
              <span className="font-medium text-stone-900">{getUploaderName(selectedResource)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>文件大小</span>
              <span className="font-medium text-stone-900">
                {formatFileSize(selectedResource.size)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>最近更新</span>
              <span className="font-medium text-stone-900">
                {formatDateTime(selectedResource.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {selectedResource.description ? (
        <section className="rounded-[28px] border border-[rgba(28,25,23,0.06)] bg-white px-5 py-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-400">
            资源说明
          </h4>
          <p className="mt-3 text-sm leading-7 text-stone-500">{selectedResource.description}</p>
        </section>
      ) : null}
    </div>
  )
}
