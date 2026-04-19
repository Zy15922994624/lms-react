import { MessageOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Spin } from 'antd'
import type { CourseDiscussionListItem } from '@/features/courses/types/course-discussion'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'
import {
  formatAuthorName,
  formatDateLabel,
  shouldFetchNextPage,
} from '@/features/courses/components/discussions-page/utils'

interface CourseDiscussionsListPanelProps {
  totalDiscussions: number
  totalReplies: number
  hasSelectedDiscussion: boolean
  searchValue: string
  deferredSearchValue: string
  canCreateDiscussion: boolean
  discussionsLoading: boolean
  discussions: CourseDiscussionListItem[]
  selectedDiscussionId: string | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onSearchChange: (value: string) => void
  onOpenCreateModal: () => void
  onSelectDiscussion: (discussionId: string) => void
  onFetchNextPage: () => void
}

export default function CourseDiscussionsListPanel({
  totalDiscussions,
  totalReplies,
  hasSelectedDiscussion,
  searchValue,
  deferredSearchValue,
  canCreateDiscussion,
  discussionsLoading,
  discussions,
  selectedDiscussionId,
  hasNextPage,
  isFetchingNextPage,
  onSearchChange,
  onOpenCreateModal,
  onSelectDiscussion,
  onFetchNextPage,
}: CourseDiscussionsListPanelProps) {
  return (
    <section className="app-panel overflow-hidden">
      <div className={workspacePanelPadding.blockHeader}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              课程讨论
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-stone-900">主题讨论</h2>
            <div className="text-sm text-stone-500">
              共 {totalDiscussions} 条
              {hasSelectedDiscussion ? `，当前 ${totalReplies} 条回复` : ''}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              allowClear
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索主题或正文"
              className="min-w-[240px]"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!canCreateDiscussion}
              onClick={onOpenCreateModal}
            >
              发起讨论
            </Button>
          </div>
        </div>
      </div>

      <div className={workspacePanelPadding.blockBody}>
        {discussionsLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Spin />
          </div>
        ) : discussions.length ? (
          <div
            className="h-[520px] overflow-y-auto pr-2 xl:h-[620px]"
            onScroll={(event) => {
              if (shouldFetchNextPage(event) && hasNextPage && !isFetchingNextPage) {
                onFetchNextPage()
              }
            }}
          >
            <div className="space-y-3">
              {discussions.map((discussion) => {
                const active = discussion.id === selectedDiscussionId

                return (
                  <button
                    key={discussion.id}
                    type="button"
                    onClick={() => onSelectDiscussion(discussion.id)}
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

              {isFetchingNextPage ? (
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
                <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreateModal}>
                  发起讨论
                </Button>
              ) : null}
            </Empty>
          </div>
        )}
      </div>
    </section>
  )
}
