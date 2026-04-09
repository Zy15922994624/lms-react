import { useMemo, useState } from 'react'
import { Alert, Button, Modal, Select, Space, Tag, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons'
import type { CourseSummary } from '@/features/courses/types/course'
import { questionBankService } from '@/features/question-bank/services/question-bank.service'
import type { QuestionBankImportResult } from '@/features/question-bank/types/question-bank'
import { uiMessage } from '@/shared/components/feedback/message'

const { Dragger } = Upload

const templateFieldLabels = ['题干', '题型', '分值', '选项', '参考答案', '题目解析', '补充说明']
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  const resetState = () => {
    setCourseId(undefined)
    setSelectedFile(null)
    setFileList([])
    setResult(null)
  }

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const isExcel = /\.(xlsx|xls)$/i.test(file.name)
      if (!isExcel) {
        uiMessage.warning('请选择 xlsx 或 xls 文件')
        return Upload.LIST_IGNORE
      }

      setSelectedFile(file)
      setFileList([
        {
          uid: file.uid,
          name: file.name,
          status: 'done',
          size: file.size,
          type: file.type,
          originFileObj: file,
        },
      ])
      return false
    },
    onRemove: () => {
      setSelectedFile(null)
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
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      uiMessage.error('模板下载失败')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleClose = () => {
    resetState()
    onCancel()
  }

  const handleSubmit = async () => {
    const currentFile = selectedFile ?? (fileList[0]?.originFileObj instanceof File ? fileList[0].originFileObj : null)

    if (!courseId) {
      uiMessage.warning('请选择所属课程')
      return
    }

    if (!currentFile) {
      uiMessage.warning('请选择要导入的 Excel 文件')
      return
    }

    try {
      setImporting(true)
      const importResult = await questionBankService.importByExcel(currentFile, courseId)
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
      title="导入题目"
      width={680}
      okText="开始导入"
      cancelText="取消"
      confirmLoading={importing || submitting}
      destroyOnHidden
      onCancel={handleClose}
      onOk={() => void handleSubmit()}
      afterOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetState()
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

        <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
          <div className="text-sm font-medium text-stone-700">模板说明</div>
          <div className="text-sm leading-6 text-stone-500">
            字段：
            {templateFieldLabels.join('、')}
          </div>
          <div className="text-xs leading-6 text-stone-500">
            题型值：{typeRules.join('；')}
          </div>
        </div>

        {result ? (
          <div className="space-y-3">
            <Alert
              type={result.errorCount > 0 ? 'warning' : 'success'}
              title={`成功 ${result.successCount} 条，失败 ${result.errorCount} 条`}
              showIcon
            />

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
              <Tag className="m-0 rounded-full px-3 py-1">总条数 {result.total}</Tag>
              <Tag color="success" className="m-0 rounded-full px-3 py-1">
                成功 {result.successCount}
              </Tag>
              <Tag color="warning" className="m-0 rounded-full px-3 py-1">
                失败 {result.errorCount}
              </Tag>
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
