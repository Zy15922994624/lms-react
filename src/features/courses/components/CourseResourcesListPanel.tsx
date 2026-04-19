import { Button, Empty, Input, Pagination, Popconfirm, Select, Spin, Tag } from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  resourceTypeMeta,
  resourceTypeOptions,
  sortOptions,
  type ResourceSortKey,
  type ResourceTypeFilter,
} from '@/features/courses/constants/course-resource-ui'
import { courseResourceService } from '@/features/courses/services/course-resource.service'
import type { CourseResource } from '@/features/courses/types/course-resource'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'

interface CourseResourcesListPanelProps {
  canManageResources: boolean
  searchInput: string
  selectedType: ResourceTypeFilter
  sortBy: ResourceSortKey
  currentPage: number
  pageSize: number
  totalResources: number
  sortedResources: CourseResource[]
  selectedResourceId: string | null
  isResourcesFetching: boolean
  highlightedSummary: string
  courseId: string
  onSearchInputChange: (value: string) => void
  onSearch: (value: string) => void
  onSelectType: (value: ResourceTypeFilter) => void
  onSortByChange: (value: ResourceSortKey) => void
  onSelectResource: (resourceId: string) => void
  onOpenCreateModal: () => void
  onEditResource: (resource: CourseResource) => void
  onDeleteResource: (resourceId: string) => void
  isDeletingResource: (resourceId: string) => boolean
  onPaginationChange: (page: number, nextPageSize: number) => void
  onPageSizeChange: (nextPageSize: number) => void
}

export default function CourseResourcesListPanel({
  canManageResources,
  searchInput,
  selectedType,
  sortBy,
  currentPage,
  pageSize,
  totalResources,
  sortedResources,
  selectedResourceId,
  isResourcesFetching,
  highlightedSummary,
  courseId,
  onSearchInputChange,
  onSearch,
  onSelectType,
  onSortByChange,
  onSelectResource,
  onOpenCreateModal,
  onEditResource,
  onDeleteResource,
  isDeletingResource,
  onPaginationChange,
  onPageSizeChange,
}: CourseResourcesListPanelProps) {
  return (
    <div className="app-panel overflow-hidden">
      <div className={`border-b border-[var(--lms-color-border)] ${workspacePanelPadding.section}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              课程资源
            </div>
            <h2 className="mt-3 text-[clamp(28px,2.4vw,40px)] font-semibold tracking-[-0.04em] text-stone-900">
              资源工作台
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-500">{highlightedSummary}</p>
          </div>

          {canManageResources ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="h-11 self-start rounded-full border-0 bg-[var(--lms-color-primary)] px-5 shadow-[0_14px_30px_rgba(255,107,53,0.22)] hover:bg-[var(--lms-color-primary)]"
              onClick={onOpenCreateModal}
            >
              上传资源
            </Button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_180px] 2xl:grid-cols-[minmax(0,1fr)_200px_200px]">
          <Input.Search
            allowClear
            placeholder="搜索标题、说明或文件名"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onSearch={onSearch}
            className="[&_.ant-input-affix-wrapper]:rounded-full [&_.ant-input-affix-wrapper]:border-[var(--lms-color-border)] [&_.ant-input-affix-wrapper]:px-4 [&_.ant-input-group-addon_.ant-btn]:rounded-full"
          />

          <Select
            value={selectedType}
            options={resourceTypeOptions}
            onChange={(value) => onSelectType(value as ResourceTypeFilter)}
            className="[&_.ant-select-selector]:rounded-full [&_.ant-select-selector]:border-[var(--lms-color-border)] [&_.ant-select-selector]:px-4 [&_.ant-select-selector]:py-1"
          />

          <Select
            value={sortBy}
            options={sortOptions}
            onChange={(value) => onSortByChange(value as ResourceSortKey)}
            className="[&_.ant-select-selector]:rounded-full [&_.ant-select-selector]:border-[var(--lms-color-border)] [&_.ant-select-selector]:px-4 [&_.ant-select-selector]:py-1"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {resourceTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectType(option.value)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                selectedType === option.value
                  ? 'bg-[var(--lms-color-primary)] text-white shadow-[0_12px_24px_rgba(255,107,53,0.18)]'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[540px]">
        {isResourcesFetching ? (
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-4">
            <div className="rounded-full bg-white px-4 py-2 shadow-[0_12px_32px_rgba(28,25,23,0.08)]">
              <Spin size="small" />
            </div>
          </div>
        ) : null}

        {sortedResources.length ? (
          <div className="divide-y divide-[var(--lms-color-border)]">
            {sortedResources.map((resource) => {
              const typeMeta = resourceTypeMeta[resource.type]
              const isSelected = resource.id === selectedResourceId

              return (
                <article
                  key={resource.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectResource(resource.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelectResource(resource.id)
                    }
                  }}
                  className={[
                    'group cursor-pointer px-6 py-5 transition duration-200 sm:px-8 2xl:px-10 2xl:py-6',
                    isSelected
                      ? 'bg-[linear-gradient(180deg,#fff8f3_0%,#fffdfb_100%)]'
                      : 'hover:bg-[rgba(255,247,242,0.78)]',
                  ].join(' ')}
                >
                  <div className="flex gap-4">
                    <div
                      className={[
                        'mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base transition',
                        typeMeta.iconClassName,
                      ].join(' ')}
                    >
                      {typeMeta.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between 2xl:gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-stone-900">
                              {resource.title}
                            </h3>
                            <Tag className={`rounded-full border-0 px-3 py-1 ${typeMeta.tagClassName}`}>
                              {typeMeta.label}
                            </Tag>
                            {isSelected ? (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-500 shadow-[0_8px_18px_rgba(28,25,23,0.05)]">
                                当前查看
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div
                          className={[
                            'flex shrink-0 flex-wrap items-center gap-2 transition xl:justify-end 2xl:min-w-[240px]',
                            isSelected
                              ? 'opacity-100'
                              : 'opacity-100 xl:translate-y-1 xl:opacity-0 xl:group-hover:translate-y-0 xl:group-hover:opacity-100',
                          ].join(' ')}
                        >
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={(event) => {
                              event.stopPropagation()
                              void courseResourceService.downloadCourseResource(courseId, resource)
                            }}
                          >
                            下载
                          </Button>

                          {canManageResources ? (
                            <Button
                              icon={<EditOutlined />}
                              onClick={(event) => {
                                event.stopPropagation()
                                onEditResource(resource)
                              }}
                            >
                              编辑
                            </Button>
                          ) : null}

                          {canManageResources ? (
                            <Popconfirm
                              title="确认删除这项资源吗？"
                              description="删除后文件与资源记录都会一起移除。"
                              okText="删除"
                              cancelText="取消"
                              onConfirm={() => onDeleteResource(resource.id)}
                            >
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                loading={isDeletingResource(resource.id)}
                                onClick={(event) => event.stopPropagation()}
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-16 sm:px-8">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<div className="text-base font-medium text-stone-700">当前还没有课程资源</div>}
            >
              {canManageResources ? (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="mt-4 rounded-full bg-[var(--lms-color-primary)] px-5"
                  onClick={onOpenCreateModal}
                >
                  上传资源
                </Button>
              ) : null}
            </Empty>
          </div>
        )}
      </div>

      {totalResources > pageSize ? (
        <div className="border-t border-[var(--lms-color-border)] px-6 py-4 sm:px-8">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalResources}
            showSizeChanger
            showTotal={(total) => `共 ${total} 项资源`}
            onChange={onPaginationChange}
            onShowSizeChange={(_, nextPageSize) => onPageSizeChange(nextPageSize)}
          />
        </div>
      ) : null}
    </div>
  )
}
