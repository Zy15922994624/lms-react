import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import CourseResourceFormModal from '@/features/courses/components/CourseResourceFormModal'
import CourseResourcesListPanel from '@/features/courses/components/CourseResourcesListPanel'
import CourseResourcesPreviewPanel from '@/features/courses/components/CourseResourcesPreviewPanel'
import CourseResourceImagePreviewModal from '@/features/courses/components/CourseResourceImagePreviewModal'
import { useCourseResourcesPageModel } from '@/features/courses/hooks/useCourseResourcesPageModel'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { ROUTES } from '@/shared/constants/routes'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'

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

  return (
    <CourseWorkspaceFrame course={course}>
      <WorkspaceLayout
        preset="resource"
        aside={
          <CourseResourcesPreviewPanel
            courseId={courseId}
            selectedResource={selectedResource}
            onOpenImagePreview={openImagePreview}
          />
        }
      >
        <CourseResourcesListPanel
          canManageResources={canManageResources}
          searchInput={searchInput}
          selectedType={selectedType}
          sortBy={sortBy}
          currentPage={currentPage}
          pageSize={pageSize}
          totalResources={totalResources}
          sortedResources={sortedResources}
          selectedResourceId={selectedResourceId}
          isResourcesFetching={isResourcesFetching}
          highlightedSummary={highlightedSummary}
          courseId={courseId}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onSelectType={(value) => {
            setCurrentPage(1)
            setSelectedType(value)
          }}
          onSortByChange={setSortBy}
          onSelectResource={setSelectedResourceId}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onEditResource={setEditingResource}
          onDeleteResource={(resourceId) => deleteResourceMutation.mutate(resourceId)}
          isDeletingResource={(resourceId) =>
            deleteResourceMutation.isPending && deleteResourceMutation.variables === resourceId
          }
          onPaginationChange={(page, nextPageSize) => {
            setCurrentPage(page)
            if (nextPageSize !== pageSize) {
              setPageSize(nextPageSize)
            }
          }}
          onPageSizeChange={(nextPageSize) => {
            setCurrentPage(1)
            setPageSize(nextPageSize)
          }}
        />
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

      <CourseResourceImagePreviewModal
        selectedResource={selectedResource}
        isImagePreviewOpen={isImagePreviewOpen}
        imageScale={imageScale}
        imageOffset={imageOffset}
        isImageDragging={isImageDragging}
        imagePreviewContainerRef={imagePreviewContainerRef}
        onClose={closeImagePreview}
        onAdjustScale={adjustImageScale}
        onReset={resetImagePreviewState}
        onPointerDown={handleImagePointerDown}
        onPointerMove={handleImagePointerMove}
        onPointerUp={handleImagePointerUp}
      />
    </CourseWorkspaceFrame>
  )
}
