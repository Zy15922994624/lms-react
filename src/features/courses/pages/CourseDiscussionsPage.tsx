import { useDeferredValue, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import CourseDiscussionFormModal from '@/features/courses/components/CourseDiscussionFormModal'
import CourseDiscussionsListPanel from '@/features/courses/components/discussions-page/CourseDiscussionsListPanel'
import CourseDiscussionsDetailAside from '@/features/courses/components/discussions-page/CourseDiscussionsDetailAside'
import {
  DISCUSSIONS_PAGE_SIZE,
  REPLIES_PAGE_SIZE,
} from '@/features/courses/components/discussions-page/utils'
import { courseDiscussionService } from '@/features/courses/services/course-discussion.service'
import { courseService } from '@/features/courses/services/course.service'
import type { CourseDiscussionReply } from '@/features/courses/types/course-discussion'
import { useAuthStore } from '@/features/auth/store/auth.store'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { ROUTES } from '@/shared/constants/routes'

export default function CourseDiscussionsPage() {
  const { courseId = '' } = useParams()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [searchValue, setSearchValue] = useState('')
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const deferredSearchValue = useDeferredValue(searchValue.trim())

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: Boolean(courseId),
  })

  const discussionsQuery = useInfiniteQuery({
    queryKey: ['course-discussions', courseId, deferredSearchValue],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      courseDiscussionService.getCourseDiscussions(courseId, {
        page: pageParam,
        pageSize: DISCUSSIONS_PAGE_SIZE,
        search: deferredSearchValue || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((count, page) => count + page.items.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    enabled: Boolean(courseId),
  })

  const discussions = useMemo(
    () => discussionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [discussionsQuery.data],
  )
  const totalDiscussions = discussionsQuery.data?.pages[0]?.total ?? 0

  const activeDiscussionId = useMemo(() => {
    if (!discussions.length) {
      return null
    }

    if (selectedDiscussionId && discussions.some((item) => item.id === selectedDiscussionId)) {
      return selectedDiscussionId
    }

    return discussions[0].id
  }, [discussions, selectedDiscussionId])

  const selectedDiscussion = useQuery({
    queryKey: ['course-discussion', courseId, activeDiscussionId],
    queryFn: () => courseDiscussionService.getCourseDiscussionById(courseId, activeDiscussionId || ''),
    enabled: Boolean(courseId && activeDiscussionId),
  }).data ?? null

  const repliesQuery = useInfiniteQuery({
    queryKey: ['course-discussion-replies', courseId, activeDiscussionId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      courseDiscussionService.getCourseDiscussionReplies(courseId, activeDiscussionId || '', {
        page: pageParam,
        pageSize: REPLIES_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((count, page) => count + page.items.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    enabled: Boolean(courseId && activeDiscussionId),
  })

  const replies = useMemo<CourseDiscussionReply[]>(
    () => repliesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [repliesQuery.data],
  )
  const totalReplies = repliesQuery.data?.pages[0]?.total ?? 0

  const refreshDiscussionList = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-discussions', courseId] })
  }

  const refreshDiscussionDetail = async (discussionId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['course-discussion', courseId, discussionId] }),
      queryClient.invalidateQueries({ queryKey: ['course-discussion-replies', courseId, discussionId] }),
    ])
  }

  const createDiscussionMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      courseDiscussionService.createCourseDiscussion(courseId, payload),
    onSuccess: async (created) => {
      uiMessage.success('讨论已发布')
      setCreateModalOpen(false)
      setSelectedDiscussionId(created.id)
      await Promise.all([
        refreshDiscussionList(),
        queryClient.setQueryData(['course-discussion', courseId, created.id], created),
      ])
    },
  })

  const deleteDiscussionMutation = useMutation({
    mutationFn: (discussionId: string) =>
      courseDiscussionService.deleteCourseDiscussion(courseId, discussionId),
    onSuccess: async (_, discussionId) => {
      uiMessage.success('讨论已删除')
      const nextItem = discussions.find((item) => item.id !== discussionId)
      setSelectedDiscussionId(nextItem?.id ?? null)
      await refreshDiscussionList()
      queryClient.removeQueries({ queryKey: ['course-discussion', courseId, discussionId] })
      queryClient.removeQueries({ queryKey: ['course-discussion-replies', courseId, discussionId] })
    },
  })

  const createReplyMutation = useMutation({
    mutationFn: ({ discussionId, content }: { discussionId: string; content: string }) =>
      courseDiscussionService.createCourseDiscussionReply(courseId, discussionId, { content }),
    onSuccess: async (_, variables) => {
      uiMessage.success('回复已发送')
      setReplyContent('')
      await Promise.all([refreshDiscussionList(), refreshDiscussionDetail(variables.discussionId)])
    },
  })

  const deleteReplyMutation = useMutation({
    mutationFn: ({ discussionId, replyId }: { discussionId: string; replyId: string }) =>
      courseDiscussionService.deleteCourseDiscussionReply(courseId, discussionId, replyId),
    onSuccess: async (_, variables) => {
      uiMessage.success('回复已删除')
      await Promise.all([refreshDiscussionList(), refreshDiscussionDetail(variables.discussionId)])
    },
  })

  if (isCourseLoading) {
    return <PageLoading />
  }

  if (!course) {
    return <Navigate to={ROUTES.COURSES} replace />
  }

  const canCreateDiscussion = Boolean(currentUser)
  const canReply = Boolean(currentUser && selectedDiscussion)

  return (
    <CourseWorkspaceFrame course={course}>
      <CourseDiscussionFormModal
        open={createModalOpen}
        loading={createDiscussionMutation.isPending}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={async (payload) => {
          await createDiscussionMutation.mutateAsync(payload)
        }}
      />

      <WorkspaceLayout
        preset="resource"
        aside={
          <CourseDiscussionsDetailAside
            selectedDiscussion={selectedDiscussion}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            repliesLoading={repliesQuery.isLoading}
            replies={replies}
            hasNextReplies={Boolean(repliesQuery.hasNextPage)}
            isFetchingNextReplies={repliesQuery.isFetchingNextPage}
            replyContent={replyContent}
            canReply={canReply}
            deletingDiscussion={deleteDiscussionMutation.isPending}
            deletingReply={deleteReplyMutation.isPending}
            creatingReply={createReplyMutation.isPending}
            onReplyContentChange={setReplyContent}
            onFetchNextReplies={() => {
              void repliesQuery.fetchNextPage()
            }}
            onDeleteDiscussion={(discussionId) => deleteDiscussionMutation.mutate(discussionId)}
            onDeleteReply={(discussionId, replyId) =>
              deleteReplyMutation.mutate({ discussionId, replyId })
            }
            onSendReply={(discussionId, content) =>
              createReplyMutation.mutate({ discussionId, content })
            }
          />
        }
      >
        <CourseDiscussionsListPanel
          totalDiscussions={totalDiscussions}
          totalReplies={totalReplies}
          hasSelectedDiscussion={Boolean(selectedDiscussion)}
          searchValue={searchValue}
          deferredSearchValue={deferredSearchValue}
          canCreateDiscussion={canCreateDiscussion}
          discussionsLoading={discussionsQuery.isLoading}
          discussions={discussions}
          selectedDiscussionId={activeDiscussionId}
          hasNextPage={Boolean(discussionsQuery.hasNextPage)}
          isFetchingNextPage={discussionsQuery.isFetchingNextPage}
          onSearchChange={setSearchValue}
          onOpenCreateModal={() => setCreateModalOpen(true)}
          onSelectDiscussion={setSelectedDiscussionId}
          onFetchNextPage={() => {
            void discussionsQuery.fetchNextPage()
          }}
        />
      </WorkspaceLayout>
    </CourseWorkspaceFrame>
  )
}
