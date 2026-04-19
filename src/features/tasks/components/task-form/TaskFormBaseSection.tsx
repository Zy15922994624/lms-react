import { DatePicker, Form, Input, Radio, Segmented, Select, Switch } from 'antd'
import type { CourseSummary } from '@/features/courses/types/course'
import { taskTypeOptions } from '@/features/tasks/components/task-form/constants'

interface TaskFormBaseSectionProps {
  mode: 'create' | 'edit'
  courses: CourseSummary[]
}

export default function TaskFormBaseSection({ mode, courses }: TaskFormBaseSectionProps) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Form.Item
          label="所属课程"
          name="courseId"
          rules={[{ required: true, message: '请选择课程' }]}
          className="!mb-0"
        >
          <Select
            placeholder="选择课程"
            options={courses.map((course) => ({
              label: course.title,
              value: course.id,
            }))}
            disabled={mode === 'edit'}
          />
        </Form.Item>

        <Form.Item
          label="任务类型"
          name="type"
          rules={[{ required: true, message: '请选择任务类型' }]}
          className="!mb-0"
        >
          <Segmented block options={taskTypeOptions} />
        </Form.Item>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Form.Item
          label="任务标题"
          name="title"
          rules={[{ required: true, message: '请输入任务标题' }]}
          className="!mb-0"
        >
          <Input placeholder="输入任务标题" maxLength={100} />
        </Form.Item>
      </div>

      <Form.Item label="任务说明" name="description" className="!mb-0">
        <Input.TextArea rows={4} placeholder="补充任务要求" maxLength={4000} />
      </Form.Item>

      <div className="grid gap-4 lg:grid-cols-3">
        <Form.Item
          label="截止时间"
          name="dueDate"
          rules={[{ required: true, message: '请选择截止时间' }]}
          className="!mb-0"
        >
          <DatePicker showTime className="w-full" />
        </Form.Item>

        <Form.Item label="分配范围" name="assignmentMode" className="!mb-0">
          <Radio.Group optionType="button" buttonStyle="solid" className="w-full">
            <Radio.Button value="all">全班</Radio.Button>
            <Radio.Button value="selected">定向</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="发布状态" className="!mb-0">
          <div className="flex h-[54px] items-center rounded-[14px] border border-[rgba(28,25,23,0.08)] px-4">
            <Form.Item name="isPublished" valuePropName="checked" noStyle>
              <Switch checkedChildren="发布" unCheckedChildren="草稿" />
            </Form.Item>
          </div>
        </Form.Item>
      </div>
    </>
  )
}
