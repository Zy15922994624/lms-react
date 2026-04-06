import { type UIEvent, useDeferredValue, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  DeleteOutlined,
  MessageOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Button, Empty, Input, Popconfirm, Spin } from 'antd'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import CourseDiscussionFormModal from '@/features/courses/components/CourseDiscussionFormModal'
import { courseDiscussionService } from '@/features/courses/services/course-discussion.service'
import { courseService } from '@/features/courses/services/course.service'
import type {
  CourseDiscussionReply,
} from '@/features/courses/types/course-discussion'
import { useAuthStore } from '@/features/auth/store/auth.store'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'
import { ROUTES } from '@/shared/constants/routes'

const DISCUSSIONS_PAGE_SIZE = 5
const REPLIES_PAGE_SIZE = 5
const SCROLL_THRESHOLD = 56

function shouldFetchNextPage(event: UIEvent<HTMLDivElement>) {
  const target = event.currentTarget
  return target.scrollHeight - target.scrollTop - target.clientHeight <= SCROLL_THRESHOLD
}
function formatDateLabel(value?: string) {
  if (!value) {
    return '刚刚'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatAuthorName(author?: { username: string; fullName?: string }) {
  if (!author) {
    return '未知成员'
  }

  return author.fullName || author.username || '未知成员'
}

function canDeleteByRole(currentUserId?: string, role?: string, authorId?: string) {
  if (!currentUserId || !role) {
    return false
  }

  if (role === 'admin' || role === 'teacher') {
    return true
  }

  return currentUserId === authorId
}

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

  const selectedDiscussionSummary = useMemo(
    () => discussions.find((item) => item.id === activeDiscussionId) ?? null,
    [activeDiscussionId, discussions],
  )

  const discussionDetailQuery = useQuery({
    queryKey: ['course-discussion', courseId, activeDiscussionId],
    queryFn: () => courseDiscussionService.getCourseDiscussionById(courseId, activeDiscussionId || ''),
    enabled: Boolean(courseId && activeDiscussionId),
  })

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
  const selectedDiscussion = discussionDetailQuery.data ?? null

  const refreshDiscussionList = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-discussions', courseId] })
  }

  const refreshDiscussionDetail = async (discussionId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['course-discussion', courseId, discussionId],
      }),
      queryClient.invalidateQueries({
        queryKey: ['course-discussion-replies', courseId, discussionId],
      }),
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
      if (discussionId) {
        queryClient.removeQueries({
          queryKey: ['course-discussion', courseId, discussionId],
        })
        queryClient.removeQueries({
          queryKey: ['course-discussion-replies', courseId, discussionId],
        })
      }
    },
  })

  const createReplyMutation = useMutation({
    mutationFn: ({ discussionId, content }: { discussionId: string; content: string }) =>
      courseDiscussionService.createCourseDiscussionReply(courseId, discussionId, { content }),
    onSuccess: async (_, variables) => {
      uiMessage.success('回复已发送')
      setReplyContent('')
      await Promise.all([
        refreshDiscussionList(),
        refreshDiscussionDetail(variables.discussionId),
      ])
    },
  })

  const deleteReplyMutation = useMutation({
    mutationFn: ({ discussionId, replyId }: { discussionId: string; replyId: string }) =>
      courseDiscussionService.deleteCourseDiscussionReply(courseId, discussionId, replyId),
    onSuccess: async (_, variables) => {
      uiMessage.success('回复已删除')
      await Promise.all([
        refreshDiscussionList(),
        refreshDiscussionDetail(variables.discussionId),
      ])
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
  const detailAside = (
    <section className={`app-panel overflow-hidden ${workspacePanelPadding.aside}`}>
      {selectedDiscussion ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              当前讨论
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">
              {selectedDiscussion.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span>{formatAuthorName(selectedDiscussion.author)}</span>
              <span>{formatDateLabel(selectedDiscussion.createdAt)}</span>
              <span>{selectedDiscussion.replyCount} 条回复</span>
            </div>
          </div>

          <div className="rounded-[24px] bg-stone-50 px-5 py-5 text-sm leading-7 text-stone-600">
            {selectedDiscussion.content}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-stone-900">回复</h3>
              {canDeleteByRole(currentUser?.id, currentUser?.role, selectedDiscussion.authorId) ? (
                <Popconfirm
                  title="删除这条讨论？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => deleteDiscussionMutation.mutate(selectedDiscussion.id)}
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deleteDiscussionMutation.isPending}
                  >
                    删除
                  </Button>
                </Popconfirm>
              ) : null}
            </div>

            {repliesQuery.isLoading ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <Spin />
              </div>
            ) : (
              <div
                className="h-[320px] overflow-y-auto pr-2 md:h-[360px] xl:h-[420px]"
                onScroll={(event) => {
                  if (
                    shouldFetchNextPage(event) &&
                    repliesQuery.hasNextPage &&
                    !repliesQuery.isFetchingNextPage
                  ) {
                    void repliesQuery.fetchNextPage()
                  }
                }}
              >
                <div className="space-y-3">
                {replies.length ? (
                  replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-[22px] border border-[var(--lms-color-border)] bg-white px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-stone-900">
                            {formatAuthorName(reply.author)}
                          </div>
                          <div className="mt-1 text-xs text-stone-400">
                            {formatDateLabel(reply.createdAt)}
                          </div>
                        </div>
                        {canDeleteByRole(currentUser?.id, currentUser?.role, reply.authorId) ? (
                          <Popconfirm
                            title="删除这条回复？"
                            okText="删除"
                            cancelText="取消"
                            onConfirm={() =>
                              deleteReplyMutation.mutate({
                                discussionId: selectedDiscussion.id,
                                replyId: reply.id,
                              })
                            }
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              loading={deleteReplyMutation.isPending}
                            />
                          </Popconfirm>
                        ) : null}
                      </div>
                      <div className="mt-3 text-sm leading-7 text-stone-600">{reply.content}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[var(--lms-color-border)] px-4 py-8 text-center text-sm text-stone-400">
                    暂无回复
                  </div>
                )}

                  {repliesQuery.isFetchingNextPage ? (
                    <div className="flex justify-center py-2">
                      <Spin size="small" />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-[var(--lms-color-border)] pt-4">
            <Input.TextArea
              value={replyContent}
              onChange={(event) => setReplyContent(event.target.value)}
              placeholder="回复内容"
              rows={4}
              maxLength={2000}
            />
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<SendOutlined />}
                disabled={!canReply || !replyContent.trim()}
                loading={createReplyMutation.isPending}
                onClick={() => {
                  if (!selectedDiscussion || !replyContent.trim()) {
                    return
                  }

                  createReplyMutation.mutate({
                    discussionId: selectedDiscussion.id,
                    content: replyContent.trim(),
                  })
                }}
              >
                发送回复
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无讨论" />
      )}
    </section>
  )

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

      <WorkspaceLayout preset="resource" aside={detailAside}>
        <section className="app-panel overflow-hidden">
          <div className={workspacePanelPadding.blockHeader}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  课程讨论
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                  主题讨论
                </h2>
                <div className="text-sm text-stone-500">
                  共 {totalDiscussions} 条
                  {selectedDiscussion ? `，当前 ${totalReplies} 条回复` : ''}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  allowClear
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="搜索主题或正文"
                  className="min-w-[240px]"
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!canCreateDiscussion}
                  onClick={() => setCreateModalOpen(true)}
                >
                  发起讨论
                </Button>
              </div>
            </div>
          </div>

          <div className={workspacePanelPadding.blockBody}>
            {discussionsQuery.isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <Spin />
              </div>
            ) : discussions.length ? (
              <div
                className="h-[520px] overflow-y-auto pr-2 xl:h-[620px]"
                onScroll={(event) => {
                  if (
                    shouldFetchNextPage(event) &&
                    discussionsQuery.hasNextPage &&
                    !discussionsQuery.isFetchingNextPage
                  ) {
                    void discussionsQuery.fetchNextPage()
                  }
                }}
              >
                <div className="space-y-3">
                  {discussions.map((discussion) => {
                    const active = discussion.id === selectedDiscussionSummary?.id

                    return (
                      <button
                        key={discussion.id}
                        type="button"
                        onClick={() => setSelectedDiscussionId(discussion.id)}
                        className={[
                          'w-full rounded-[28px] border px-5 py-5 text-left transition',
                          active
                            ? 'border-[rgba(255,107,53,0.28)] bg-[linear-gradient(180deg,#fff7f1_0%,#fffdfa_100%)] shadow-[0_20px_48px_rgba(28,25,23,0.08)]'
                            : 'border-[var(--lms-color-border)] bg-white hover:border-[rgba(255,107,53,0.18)] hover:shadow-[0_14px_32px_rgba(28,25,23,0.06)]',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-stone-400">
                              <MessageOutlined />
                              <span>{formatAuthorName(discussion.author)}</span>
                              <span>{formatDateLabel(discussion.lastReplyAt || discussion.createdAt)}</span>
                            </div>
                            <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-stone-900">
                              {discussion.title}
                            </div>
                            <div className="mt-2 line-clamp-2 text-sm leading-7 text-stone-500">
                              {discussion.content}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                              {discussion.replyCount}
                            </div>
                            <div className="mt-1 text-xs text-stone-400">回复</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {discussionsQuery.isFetchingNextPage ? (
                    <div className="flex justify-center py-2">
                      <Spin size="small" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={deferredSearchValue ? '没有匹配结果' : '当前还没有讨论'}
                >
                  {canCreateDiscussion ? (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalOpen(true)}
                    >
                      发起讨论
                    </Button>
                  ) : null}
                </Empty>
              </div>
            )}
          </div>
        </section>
      </WorkspaceLayout>
    </CourseWorkspaceFrame>
  )
}
