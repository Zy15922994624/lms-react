import type { ReactNode } from 'react'
import {
  FileTextOutlined,
  PaperClipOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import type { CourseResource, CourseResourceType } from '@/features/courses/types/course-resource'

export type ResourceTypeFilter = CourseResourceType | 'all'
export type ResourceSortKey = 'recent' | 'name' | 'size'

export const resourceTypeOptions: Array<{ label: string; value: ResourceTypeFilter }> = [
  { label: '全部', value: 'all' },
  { label: '文档', value: 'document' },
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' },
  { label: '其他', value: 'other' },
]

export const sortOptions: Array<{ label: string; value: ResourceSortKey }> = [
  { label: '最近上传', value: 'recent' },
  { label: '名称排序', value: 'name' },
  { label: '文件大小', value: 'size' },
]

export const resourceTypeMeta: Record<
  CourseResourceType,
  {
    label: string
    icon: ReactNode
    iconClassName: string
    tagClassName: string
  }
> = {
  document: {
    label: '文档',
    icon: <FileTextOutlined />,
    iconClassName: 'bg-sky-50 text-sky-600',
    tagClassName: 'bg-sky-50 text-sky-600',
  },
  video: {
    label: '视频',
    icon: <VideoCameraOutlined />,
    iconClassName: 'bg-rose-50 text-rose-600',
    tagClassName: 'bg-rose-50 text-rose-600',
  },
  image: {
    label: '图片',
    icon: <PictureOutlined />,
    iconClassName: 'bg-emerald-50 text-emerald-600',
    tagClassName: 'bg-emerald-50 text-emerald-600',
  },
  other: {
    label: '其他',
    icon: <PaperClipOutlined />,
    iconClassName: 'bg-stone-100 text-stone-600',
    tagClassName: 'bg-stone-100 text-stone-600',
  },
}

export function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${size} B`
}

export function getUploaderName(resource: CourseResource) {
  return resource.uploader?.fullName || resource.uploader?.username || '未知上传者'
}

export function sortResources(resources: CourseResource[], sortBy: ResourceSortKey) {
  const next = [...resources]

  if (sortBy === 'name') {
    next.sort((left, right) => left.title.localeCompare(right.title, 'zh-CN'))
    return next
  }

  if (sortBy === 'size') {
    next.sort((left, right) => right.size - left.size)
    return next
  }

  next.sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
  return next
}

export function canPreviewInline(resource: CourseResource) {
  return resource.type === 'image' || resource.type === 'video'
}
