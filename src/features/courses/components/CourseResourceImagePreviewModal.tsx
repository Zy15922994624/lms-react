import { Button, Modal } from 'antd'
import { MinusOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons'
import type { CourseResource } from '@/features/courses/types/course-resource'

interface CourseResourceImagePreviewModalProps {
  selectedResource: CourseResource | null
  isImagePreviewOpen: boolean
  imageScale: number
  imageOffset: { x: number; y: number }
  isImageDragging: boolean
  imagePreviewContainerRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
  onAdjustScale: (delta: number) => void
  onReset: () => void
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void
}

export default function CourseResourceImagePreviewModal({
  selectedResource,
  isImagePreviewOpen,
  imageScale,
  imageOffset,
  isImageDragging,
  imagePreviewContainerRef,
  onClose,
  onAdjustScale,
  onReset,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CourseResourceImagePreviewModalProps) {
  return (
    <Modal
      open={Boolean(selectedResource && selectedResource.type === 'image' && isImagePreviewOpen)}
      footer={null}
      width="auto"
      centered
      onCancel={onClose}
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
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onReset}
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
                onAdjustScale(-0.2)
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
                onReset()
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
                onAdjustScale(0.2)
              }}
            />
          </div>
          <img
            src={selectedResource.fileUrl}
            alt={selectedResource.title}
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority="high"
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
  )
}
