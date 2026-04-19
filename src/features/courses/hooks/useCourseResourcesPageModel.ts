import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { courseService } from '@/features/courses/services/course.service'
import { courseResourceService } from '@/features/courses/services/course-resource.service'
import { sortResources, type ResourceSortKey, type ResourceTypeFilter } from '@/features/courses/constants/course-resource-ui'
import type { CourseResource, UpdateCourseResourcePayload } from '@/features/courses/types/course-resource'
import { uiMessage } from '@/shared/components/feedback/message'
import { usePaginationState } from '@/shared/hooks/usePaginationState'
import { invalidateQueryKeys } from '@/shared/utils/invalidate-query-keys'

export function useCourseResourcesPageModel(courseId: string, focusedResourceId: string) {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const canManageResources = currentUser?.role === 'teacher' || currentUser?.role === 'admin'

  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedType, setSelectedType] = useState<ResourceTypeFilter>('all')
  const [sortBy, setSortBy] = useState<ResourceSortKey>('recent')
  const { page: currentPage, setPage: setCurrentPage, pageSize, setPageSize } =
    usePaginationState({ initialPageSize: focusedResourceId ? 100 : 10 })
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [imageScale, setImageScale] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [isImageDragging, setIsImageDragging] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<CourseResource | null>(null)
  const imagePreviewContainerRef = useRef<HTMLDivElement | null>(null)
  const imageDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: Boolean(courseId),
  })

  const {
    data: resourcesPage,
    isLoading: isResourcesLoading,
    isFetching: isResourcesFetching,
  } = useQuery({
    queryKey: ['course-resources', courseId, currentPage, pageSize, searchKeyword, selectedType],
    queryFn: () =>
      courseResourceService.getCourseResources(courseId, {
        page: currentPage,
        pageSize,
        search: searchKeyword || undefined,
        type: selectedType === 'all' ? undefined : selectedType,
      }),
    enabled: Boolean(courseId),
  })

  const createResourceMutation = useMutation({
    mutationFn: (payload: Parameters<typeof courseResourceService.createCourseResource>[1]) =>
      courseResourceService.createCourseResource(courseId, payload),
    onSuccess: async () => {
      uiMessage.success('课程资源已上传')
      setIsCreateModalOpen(false)
      await invalidateQueryKeys(queryClient, [['course-resources', courseId]])
    },
    onError: () => {
      uiMessage.error('上传课程资源失败')
    },
  })

  const updateResourceMutation = useMutation({
    mutationFn: ({
      resourceId,
      payload,
    }: {
      resourceId: string
      payload: Parameters<typeof courseResourceService.updateCourseResource>[2]
    }) => courseResourceService.updateCourseResource(courseId, resourceId, payload),
    onSuccess: async () => {
      uiMessage.success('资源信息已更新')
      setEditingResource(null)
      await invalidateQueryKeys(queryClient, [['course-resources', courseId]])
    },
    onError: () => {
      uiMessage.error('更新资源信息失败')
    },
  })

  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: string) =>
      courseResourceService.deleteCourseResource(courseId, resourceId),
    onSuccess: async (_, deletedResourceId) => {
      uiMessage.success('资源已删除')
      if (selectedResourceId === deletedResourceId) {
        setSelectedResourceId(null)
      }
      await invalidateQueryKeys(queryClient, [['course-resources', courseId]])
    },
    onError: () => {
      uiMessage.error('删除资源失败')
    },
  })

  const resources = useMemo(() => resourcesPage?.items ?? [], [resourcesPage])
  const totalResources = resourcesPage?.total ?? 0
  const sortedResources = useMemo(() => sortResources(resources, sortBy), [resources, sortBy])
  const selectedResource = useMemo(() => {
    if (!sortedResources.length) {
      return null
    }

    return (
      sortedResources.find((resource) => resource.id === selectedResourceId) ?? sortedResources[0]
    )
  }, [selectedResourceId, sortedResources])

  const highlightedSummary = useMemo(() => {
    if (!sortedResources.length) {
      return '当前暂无资源'
    }

    return `共 ${totalResources} 项资源`
  }, [sortedResources.length, totalResources])

  const handleSearch = useCallback((value: string) => {
    setCurrentPage(1)
    setSearchKeyword(value.trim())
  }, [setCurrentPage])

  const handleCreateResource = useCallback(
    async (payload: Parameters<typeof courseResourceService.createCourseResource>[1]) => {
      await createResourceMutation.mutateAsync(payload)
    },
    [createResourceMutation],
  )

  const handleUpdateResource = useCallback(
    async (values: UpdateCourseResourcePayload) => {
      if (!editingResource) return

      await updateResourceMutation.mutateAsync({
        resourceId: editingResource.id,
        payload: values,
      })
    },
    [editingResource, updateResourceMutation],
  )

  const resetImagePreviewState = useCallback(() => {
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
    setIsImageDragging(false)
    imageDragRef.current = null
  }, [])

  const adjustImageScale = useCallback((delta: number) => {
    setImageScale((previous) => {
      const next = Number(Math.min(4, Math.max(1, previous + delta)).toFixed(2))

      if (next === 1) {
        setImageOffset({ x: 0, y: 0 })
      }

      return next
    })
  }, [])

  const openImagePreview = useCallback(() => {
    resetImagePreviewState()
    setIsImagePreviewOpen(true)
  }, [resetImagePreviewState])

  const closeImagePreview = useCallback(() => {
    setIsImagePreviewOpen(false)
    resetImagePreviewState()
  }, [resetImagePreviewState])

  const handleImagePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (imageScale <= 1) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    imageDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: imageOffset.x,
      originY: imageOffset.y,
    }
    setIsImageDragging(true)
  }, [imageOffset.x, imageOffset.y, imageScale])

  const handleImagePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !imageDragRef.current ||
      imageScale <= 1 ||
      imageDragRef.current.pointerId !== event.pointerId
    ) {
      return
    }

    const deltaX = event.clientX - imageDragRef.current.startX
    const deltaY = event.clientY - imageDragRef.current.startY

    setImageOffset({
      x: imageDragRef.current.originX + deltaX,
      y: imageDragRef.current.originY + deltaY,
    })
  }, [imageScale])

  const handleImagePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      imageDragRef.current?.pointerId === event.pointerId &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    imageDragRef.current = null
    setIsImageDragging(false)
  }, [])

  useEffect(() => {
    if (!focusedResourceId) {
      return
    }

    const timer = window.setTimeout(() => {
      setCurrentPage(1)
      setPageSize(100)
      setSelectedType('all')
      setSearchInput('')
      setSearchKeyword('')
      setSelectedResourceId(focusedResourceId)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [focusedResourceId, setCurrentPage, setPageSize])

  useEffect(() => {
    if (!isImagePreviewOpen || selectedResource?.type !== 'image' || !imagePreviewContainerRef.current) {
      return
    }

    const container = imagePreviewContainerRef.current
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      adjustImageScale(-event.deltaY * 0.0015)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [adjustImageScale, isImagePreviewOpen, selectedResource?.id, selectedResource?.type])

  return {
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
  }
}
