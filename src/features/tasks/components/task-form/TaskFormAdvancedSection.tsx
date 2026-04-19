import { Button, Form, Select, Upload } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import type { QuestionBankItem } from '@/features/question-bank/types/question-bank'
import TaskQuestionSelectionSection from '@/features/tasks/components/task-form/TaskQuestionSelectionSection'
import type { AttachmentUploadFile } from '@/features/tasks/components/task-form/attachments'
import type { TaskType } from '@/features/tasks/types/task'

interface TaskFormAdvancedSectionProps {
  shouldPickQuestions: boolean
  selectedCourseId?: string
  draftQuestionRows: QuestionBankItem[]
  assignmentMode: 'all' | 'selected'
  selectedType: TaskType
  studentOptions: Array<{ label: string; value: string }>
  resourceOptions: Array<{ label: string; value: string }>
  hasCourseStudents: boolean
  hasResourcesPage: boolean
  attachmentFileList: AttachmentUploadFile[]
  setAttachmentFileList: Dispatch<SetStateAction<AttachmentUploadFile[]>>
  onOpenPicker: () => void
  onRemoveQuestion: (questionId: string) => void
}

export default function TaskFormAdvancedSection({
  shouldPickQuestions,
  selectedCourseId,
  draftQuestionRows,
  assignmentMode,
  selectedType,
  studentOptions,
  resourceOptions,
  hasCourseStudents,
  hasResourcesPage,
  attachmentFileList,
  setAttachmentFileList,
  onOpenPicker,
  onRemoveQuestion,
}: TaskFormAdvancedSectionProps) {
  return (
    <>
      {shouldPickQuestions ? (
        <TaskQuestionSelectionSection
          selectedCourseId={selectedCourseId}
          draftQuestionRows={draftQuestionRows}
          onOpenPicker={onOpenPicker}
          onRemoveQuestion={onRemoveQuestion}
        />
      ) : null}

      {assignmentMode === 'selected' ? (
        <Form.Item
          label="指定学生"
          name="assignedStudentIds"
          rules={[{ required: true, message: '请至少选择一名学生' }]}
          className="!mb-0"
        >
          <Select
            mode="multiple"
            placeholder="选择学生"
            options={studentOptions}
            loading={Boolean(selectedCourseId) && !hasCourseStudents}
          />
        </Form.Item>
      ) : null}

      {selectedType === 'reading' ? (
        <Form.Item label="关联资源" name="relatedResourceIds" className="!mb-0">
          <Select
            mode="multiple"
            placeholder="选择资源"
            options={resourceOptions}
            loading={Boolean(selectedCourseId) && !hasResourcesPage}
          />
        </Form.Item>
      ) : null}

      <Form.Item label="任务附件" className="!mb-0">
        <Upload
          multiple
          fileList={attachmentFileList}
          beforeUpload={(file) => {
            setAttachmentFileList((current) => [
              ...current,
              {
                uid: `${file.uid}-${Date.now()}`,
                name: file.name,
                status: 'done',
                originFileObj: file,
              },
            ])
            return false
          }}
          onRemove={(file) => {
            setAttachmentFileList((current) => current.filter((item) => item.uid !== file.uid))
          }}
        >
          <Button>选择附件</Button>
        </Upload>
      </Form.Item>
    </>
  )
}
