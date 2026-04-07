import { useMemo, useState } from 'react'
import { Alert, Button, Modal, Select, Space, Tag, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons'
import type { CourseSummary } from '@/features/courses/types/course'
import { questionBankService } from '@/features/question-bank/services/question-bank.service'
import type { QuestionBankImportResult } from '@/features/question-bank/types/question-bank'
import { uiMessage } from '@/shared/components/feedback/message'

const { Dragger } = Upload

const templateFieldLabels = [
  '题干',
  '题型',
  '分值',
  '选项',
  '参考答案',
  '题目解析',
  '补充说明',
]

const typeRules = [
  'single_choice：单选题',
  'multi_choice：多选题',
  'fill_text：填空题',
  'rich_text：简答题',
]

interface QuestionBankImportModalProps {
  open: boolean
  courses: CourseSummary[]
  submitting?: boolean
  onCancel: () => void
  onSuccess: (result: QuestionBankImportResult) => Promise<void> | void
}

export default function QuestionBankImportModal({
  open,
  courses,
  submitting = false,
  onCancel,
  onSuccess,
}: QuestionBankImportModalProps) {
  const [courseId, setCourseId] = useState<string>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<QuestionBankImportResult | null>(null)

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        label: course.title,
        value: course.id,
      })),
    [courses],
  )

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      setFileList([file])
      return false
    },
    onRemove: () => {
      setFileList([])
      return true
    },
  }

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true)
      const blob = await questionBankService.downloadTemplate()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = '题库导入模板.xlsx'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      uiMessage.error('模板下载失败')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleClose = () => {
    setCourseId(undefined)
    setFileList([])
    setResult(null)
    onCancel()
  }

  const handleSubmit = async () => {
    if (!courseId) {
      uiMessage.warning('请选择所属课程')
      return
    }

    const file = fileList[0]?.originFileObj
    if (!file) {
      uiMessage.warning('请选择要导入的 Excel 文件')
      return
    }

    try {
      setImporting(true)
      const importResult = await questionBankService.importByExcel(file, courseId)
      setResult(importResult)
      await onSuccess(importResult)

      if (importResult.errorCount > 0) {
        uiMessage.warning(`导入完成：成功 ${importResult.successCount} 条，失败 ${importResult.errorCount} 条`)
        return
      }

      uiMessage.success(`已导入 ${importResult.successCount} 道题目`)
      handleClose()
    } catch {
      uiMessage.error('导入题目失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Excel 导入题目"
      width={720}
      okText="开始导入"
      cancelText="取消"
      confirmLoading={importing || submitting}
      destroyOnHidden
      onCancel={handleClose}
      onOk={() => void handleSubmit()}
      afterOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setCourseId(undefined)
          setFileList([])
          setResult(null)
        }
      }}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="text-sm font-medium text-stone-700">所属课程</div>
          <Select
            showSearch
            value={courseId}
            placeholder="选择课程"
            optionFilterProp="label"
            className="w-full"
            options={courseOptions}
            onChange={setCourseId}
          />
        </div>

        <div className="space-y-3">
          <Space align="center" className="justify-between">
            <div className="text-sm font-medium text-stone-700">导入文件</div>
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              loading={downloadingTemplate}
              onClick={() => void handleDownloadTemplate()}
            >
              下载模板
            </Button>
          </Space>

          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">拖拽 Excel 到这里，或点击选择文件</p>
            <p className="ant-upload-hint">仅支持 .xlsx / .xls，单次最多 200 条</p>
          </Dragger>
        </div>

        <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
          <div className="text-sm font-medium text-stone-700">模板字段</div>
          <div className="flex flex-wrap gap-2">
            {templateFieldLabels.map((label) => (
              <Tag key={label} className="m-0 rounded-full px-3 py-1 text-sm text-stone-600">
                {label}
              </Tag>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-stone-500">
            {typeRules.map((rule) => (
              <span key={rule} className="rounded-full bg-white px-3 py-1">
                {rule}
              </span>
            ))}
          </div>
        </div>

        {result ? (
          <div className="space-y-3">
            <Alert
              type={result.errorCount > 0 ? 'warning' : 'success'}
              message={`成功 ${result.successCount} 条，失败 ${result.errorCount} 条`}
              showIcon
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <div className="text-xs text-stone-500">总条数</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950">{result.total}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="text-xs text-emerald-700">成功</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-800">{result.successCount}</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-xs text-amber-700">失败</div>
                <div className="mt-1 text-2xl font-semibold text-amber-800">{result.errorCount}</div>
              </div>
            </div>

            {result.errors.length ? (
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-sm font-medium text-amber-900">失败明细</div>
                <div className="max-h-56 space-y-2 overflow-auto text-sm text-amber-800">
                  {result.errors.map((error) => (
                    <div
                      key={`${error.index}-${error.title ?? 'unknown'}`}
                      className="rounded-xl border border-amber-200 bg-white/80 px-3 py-2"
                    >
                      <div className="font-medium">第 {error.index} 行</div>
                      {error.title ? <div className="mt-1 text-stone-700">{error.title}</div> : null}
                      <div className="mt-1">{error.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
