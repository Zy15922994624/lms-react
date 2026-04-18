import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Empty, Input, Modal, Pagination, Popconfirm, Select, Spin, Tag } from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MinusOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import CourseResourceFormModal from '@/features/courses/components/CourseResourceFormModal'
import {
  canPreviewInline,
  formatFileSize,
  getUploaderName,
  resourceTypeMeta,
  resourceTypeOptions,
  sortOptions,
  type ResourceSortKey,
  type ResourceTypeFilter,
} from '@/features/courses/constants/course-resource-ui'
import { useCourseResourcesPageModel } from '@/features/courses/hooks/useCourseResourcesPageModel'
import { courseResourceService } from '@/features/courses/services/course-resource.service'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { ROUTES } from '@/shared/constants/routes'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'
import { formatDateTime } from '@/shared/utils/date'

export default function CourseResourcesPage() {
  const { courseId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const focusedResourceId = searchParams.get('resourceId')?.trim() || ''

  const {
    canManageResources,
    searchInput,
    setSearchInput,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedResourceId,
    setSelectedResourceId,
    isImagePreviewOpen,
    imageScale,
    imageOffset,
    isImageDragging,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingResource,
    setEditingResource,
    imagePreviewContainerRef,
    course,
    isCourseLoading,
    isResourcesLoading,
    isResourcesFetching,
    totalResources,
    sortedResources,
    selectedResource,
    highlightedSummary,
    createResourceMutation,
    updateResourceMutation,
    deleteResourceMutation,
    handleSearch,
    handleCreateResource,
    handleUpdateResource,
    resetImagePreviewState,
    adjustImageScale,
    openImagePreview,
    closeImagePreview,
    handleImagePointerDown,
    handleImagePointerMove,
    handleImagePointerUp,
  } = useCourseResourcesPageModel(courseId, focusedResourceId)

  if (isCourseLoading || isResourcesLoading) {
    return <PageLoading />
  }

  if (!course) {
    return <Navigate to={ROUTES.COURSES} replace />
  }

  const renderPreviewPanel = () => {
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
                onClick={openImagePreview}
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
                <h4 className="mt-4 text-lg font-semibold text-stone-900">
                  当前资源暂不支持内嵌预览
                </h4>
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
                <span className="font-medium text-stone-900">
                  {getUploaderName(selectedResource)}
                </span>
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

  return (
    <CourseWorkspaceFrame course={course}>
      <WorkspaceLayout preset="resource" aside={renderPreviewPanel()}>
        <div className="app-panel overflow-hidden">
          <div
            className={`border-b border-[var(--lms-color-border)] ${workspacePanelPadding.section}`}
          >
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
                  onClick={() => setIsCreateModalOpen(true)}
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
                onChange={(event) => setSearchInput(event.target.value)}
                onSearch={handleSearch}
                className="[&_.ant-input-affix-wrapper]:rounded-full [&_.ant-input-affix-wrapper]:border-[var(--lms-color-border)] [&_.ant-input-affix-wrapper]:px-4 [&_.ant-input-group-addon_.ant-btn]:rounded-full"
              />

              <Select
                value={selectedType}
                options={resourceTypeOptions}
                onChange={(value) => {
                  setCurrentPage(1)
                  setSelectedType(value as ResourceTypeFilter)
                }}
                className="[&_.ant-select-selector]:rounded-full [&_.ant-select-selector]:border-[var(--lms-color-border)] [&_.ant-select-selector]:px-4 [&_.ant-select-selector]:py-1"
              />

              <Select
                value={sortBy}
                options={sortOptions}
                onChange={(value) => setSortBy(value as ResourceSortKey)}
                className="[&_.ant-select-selector]:rounded-full [&_.ant-select-selector]:border-[var(--lms-color-border)] [&_.ant-select-selector]:px-4 [&_.ant-select-selector]:py-1"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {resourceTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setCurrentPage(1)
                    setSelectedType(option.value)
                  }}
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
                      onClick={() => setSelectedResourceId(resource.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedResourceId(resource.id)
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
                                <Tag
                                  className={`rounded-full border-0 px-3 py-1 ${typeMeta.tagClassName}`}
                                >
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
                                  void courseResourceService.downloadCourseResource(
                                    courseId,
                                    resource,
                                  )
                                }}
                              >
                                下载
                              </Button>

                              {canManageResources ? (
                                <Button
                                  icon={<EditOutlined />}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setEditingResource(resource)
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
                                  onConfirm={() => deleteResourceMutation.mutate(resource.id)}
                                >
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    loading={
                                      deleteResourceMutation.isPending &&
                                      deleteResourceMutation.variables === resource.id
                                    }
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
                  description={
                    <div className="text-base font-medium text-stone-700">当前还没有课程资源</div>
                  }
                >
                  {canManageResources ? (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="mt-4 rounded-full bg-[var(--lms-color-primary)] px-5"
                      onClick={() => setIsCreateModalOpen(true)}
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
                onChange={(page, nextPageSize) => {
                  setCurrentPage(page)
                  if (nextPageSize !== pageSize) {
                    setPageSize(nextPageSize)
                  }
                }}
                onShowSizeChange={(_, nextPageSize) => {
                  setCurrentPage(1)
                  setPageSize(nextPageSize)
                }}
              />
            </div>
          ) : null}
        </div>
      </WorkspaceLayout>

      <CourseResourceFormModal
        open={isCreateModalOpen}
        mode="create"
        loading={createResourceMutation.isPending}
        onCancel={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateResource}
      />

      {editingResource ? (
        <CourseResourceFormModal
          open
          mode="edit"
          loading={updateResourceMutation.isPending}
          initialValues={editingResource}
          onCancel={() => setEditingResource(null)}
          onSubmit={handleUpdateResource}
        />
      ) : null}

      <Modal
        open={Boolean(selectedResource && selectedResource.type === 'image' && isImagePreviewOpen)}
        footer={null}
        width="auto"
        centered
        onCancel={closeImagePreview}
        className="[&_.ant-modal-content]:bg-transparent [&_.ant-modal-content]:p-0 [&_.ant-modal-close]:text-white"
      >
        {selectedResource?.type === 'image' ? (
          <div
            ref={imagePreviewContainerRef}
            className={[
              'relative overflow-hidden rounded-[28px] bg-stone-950 shadow-[0_30px_80px_rgba(0,0,0,0.36)]',
              imageScale > 1
                ? isImageDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in',
            ].join(' ')}
            style={{ maxHeight: 'calc(var(--lms-viewport-height) - 48px)' }}
            onPointerDown={handleImagePointerDown}
            onPointerMove={handleImagePointerMove}
            onPointerUp={handleImagePointerUp}
            onPointerCancel={handleImagePointerUp}
            onDoubleClick={resetImagePreviewState}
          >
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-black/55 p-1 backdrop-blur-sm">
              <Button
                size="small"
                type="text"
                aria-label="缩小图片"
                icon={<MinusOutlined />}
                className="text-white hover:!text-white"
                onClick={(event) => {
                  event.stopPropagation()
                  adjustImageScale(-0.2)
                }}
              />
              <Button
                size="small"
                type="text"
                aria-label="重置图片缩放"
                icon={<RedoOutlined />}
                className="text-white hover:!text-white"
                onClick={(event) => {
                  event.stopPropagation()
                  resetImagePreviewState()
                }}
              />
              <Button
                size="small"
                type="text"
                aria-label="放大图片"
                icon={<PlusOutlined />}
                className="text-white hover:!text-white"
                onClick={(event) => {
                  event.stopPropagation()
                  adjustImageScale(0.2)
                }}
              />
            </div>
            <img
              src={selectedResource.fileUrl}
              alt={selectedResource.title}
              draggable={false}
              className="max-w-[min(92vw,1520px)] object-contain select-none"
              style={{
                transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageScale})`,
                transformOrigin: 'center center',
                transition: isImageDragging ? 'none' : 'transform 0.16s ease',
                maxHeight: 'calc(var(--lms-viewport-height) - 48px)',
                touchAction: imageScale > 1 ? 'none' : 'auto',
              }}
            />
          </div>
        ) : null}
      </Modal>
    </CourseWorkspaceFrame>
  )
}
