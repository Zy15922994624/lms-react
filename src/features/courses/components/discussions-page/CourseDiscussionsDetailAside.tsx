import { DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Popconfirm, Spin } from 'antd'
import type { CourseDiscussionDetail, CourseDiscussionReply } from '@/features/courses/types/course-discussion'
import {
  canDeleteByRole,
  formatAuthorName,
  formatDateLabel,
  shouldFetchNextPage,
} from '@/features/courses/components/discussions-page/utils'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'

interface CourseDiscussionsDetailAsideProps {
  selectedDiscussion: CourseDiscussionDetail | null
  currentUserId?: string
  currentUserRole?: string
  repliesLoading: boolean
  replies: CourseDiscussionReply[]
  hasNextReplies: boolean
  isFetchingNextReplies: boolean
  replyContent: string
  canReply: boolean
  deletingDiscussion: boolean
  deletingReply: boolean
  creatingReply: boolean
  onReplyContentChange: (value: string) => void
  onFetchNextReplies: () => void
  onDeleteDiscussion: (discussionId: string) => void
  onDeleteReply: (discussionId: string, replyId: string) => void
  onSendReply: (discussionId: string, content: string) => void
}

export default function CourseDiscussionsDetailAside({
  selectedDiscussion,
  currentUserId,
  currentUserRole,
  repliesLoading,
  replies,
  hasNextReplies,
  isFetchingNextReplies,
  replyContent,
  canReply,
  deletingDiscussion,
  deletingReply,
  creatingReply,
  onReplyContentChange,
  onFetchNextReplies,
  onDeleteDiscussion,
  onDeleteReply,
  onSendReply,
}: CourseDiscussionsDetailAsideProps) {
  return (
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
              {canDeleteByRole(currentUserId, currentUserRole, selectedDiscussion.authorId) ? (
                <Popconfirm
                  title="删除这条讨论？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => onDeleteDiscussion(selectedDiscussion.id)}
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deletingDiscussion}
                  >
                    删除
                  </Button>
                </Popconfirm>
              ) : null}
            </div>

            {repliesLoading ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <Spin />
              </div>
            ) : (
              <div
                className="h-[320px] overflow-y-auto pr-2 md:h-[360px] xl:h-[420px]"
                onScroll={(event) => {
                  if (shouldFetchNextPage(event) && hasNextReplies && !isFetchingNextReplies) {
                    onFetchNextReplies()
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
                          {canDeleteByRole(currentUserId, currentUserRole, reply.authorId) ? (
                            <Popconfirm
                              title="删除这条回复？"
                              okText="删除"
                              cancelText="取消"
                              onConfirm={() => onDeleteReply(selectedDiscussion.id, reply.id)}
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={deletingReply}
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

                  {isFetchingNextReplies ? (
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
              onChange={(event) => onReplyContentChange(event.target.value)}
              placeholder="回复内容"
              rows={4}
              maxLength={2000}
            />
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<SendOutlined />}
                disabled={!canReply || !replyContent.trim()}
                loading={creatingReply}
                onClick={() => {
                  if (!selectedDiscussion || !replyContent.trim()) {
                    return
                  }
                  onSendReply(selectedDiscussion.id, replyContent.trim())
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
}
