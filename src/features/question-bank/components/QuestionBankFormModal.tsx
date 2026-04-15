import { useEffect, useMemo } from 'react'
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { CourseSummary } from '@/features/courses/types/course'
import type {
  QuestionBankFormValues,
  QuestionBankItem,
  QuestionBankOption,
  QuestionType,
} from '@/features/question-bank/types/question-bank'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'

interface QuestionBankFormModalProps {
  open: boolean
  courses: CourseSummary[]
  question?: QuestionBankItem | null
  submitting?: boolean
  onCancel: () => void
  onSubmit: (values: QuestionBankFormValues) => Promise<void>
}

interface QuestionBankFormState {
  title: string
  description?: string
  type: QuestionType
  courseId: string
  options: QuestionBankOption[]
  singleAnswer?: string
  multiAnswer?: string[]
  textAnswer?: string
  analysis?: string
  score: number
}

const defaultOptions: QuestionBankOption[] = [
  { key: 'A', label: '' },
  { key: 'B', label: '' },
]

function isChoiceType(type: QuestionType) {
  return type === 'single_choice' || type === 'multi_choice'
}

function normalizeOptions(options?: QuestionBankOption[]) {
  if (!options?.length) {
    return defaultOptions.map((item) => ({ ...item }))
  }

  return options.map((item) => ({ key: item.key, label: item.label }))
}

function buildInitialValues(question?: QuestionBankItem | null): QuestionBankFormState {
  if (!question) {
    return {
      title: '',
      description: '',
      type: 'single_choice',
      courseId: '',
      options: defaultOptions.map((item) => ({ ...item })),
      singleAnswer: undefined,
      multiAnswer: [],
      textAnswer: '',
      analysis: '',
      score: 0,
    }
  }

  return {
    title: question.title,
    description: question.description ?? '',
    type: question.type,
    courseId: question.courseId,
    options: normalizeOptions(question.options),
    singleAnswer: typeof question.answer === 'string' ? question.answer : undefined,
    multiAnswer: Array.isArray(question.answer)
      ? question.answer.filter((item): item is string => typeof item === 'string')
      : [],
    textAnswer: typeof question.answer === 'string' ? question.answer : '',
    analysis: question.analysis ?? '',
    score: question.score,
  }
}

export default function QuestionBankFormModal({
  open,
  courses,
  question,
  submitting = false,
  onCancel,
  onSubmit,
}: QuestionBankFormModalProps) {
  const [form] = Form.useForm<QuestionBankFormState>()
  const { isMobile, mobileModalWidth } = useResponsiveLayout()
  const questionType = Form.useWatch('type', form) ?? 'single_choice'
  const watchedOptions = Form.useWatch('options', form)

  useEffect(() => {
    if (!open) {
      return
    }

    form.setFieldsValue(buildInitialValues(question))
  }, [form, open, question])

  const answerOptions = useMemo(
    () =>
      (watchedOptions ?? [])
        .filter((item) => item?.key?.trim() && item?.label?.trim())
        .map((item) => ({ label: `${item.key}. ${item.label}`, value: item.key.trim() })),
    [watchedOptions],
  )

  const handleFinish = async (values: QuestionBankFormState) => {
    const payload: QuestionBankFormValues = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      type: values.type,
      courseId: values.courseId,
      options: isChoiceType(values.type)
        ? values.options.map((item) => ({ key: item.key.trim(), label: item.label.trim() }))
        : undefined,
      answer:
        values.type === 'single_choice'
          ? values.singleAnswer ?? ''
          : values.type === 'multi_choice'
            ? values.multiAnswer ?? []
            : values.textAnswer?.trim() ?? '',
      analysis: values.analysis?.trim() || undefined,
      score: values.score,
    }

    await onSubmit(payload)
  }

  return (
    <Modal
      open={open}
      title={question ? '编辑题目' : '新增题目'}
      width={isMobile ? mobileModalWidth : 820}
      okText={question ? '保存修改' : '创建题目'}
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: 'calc(var(--lms-viewport-height) - 160px)',
          overflowY: 'auto',
          paddingTop: 12,
        },
      }}
      onCancel={onCancel}
      onOk={() => void form.submit()}
      afterOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.resetFields()
        }
      }}
    >
      <Form<QuestionBankFormState>
        form={form}
        layout="vertical"
        initialValues={buildInitialValues(question)}
        onFinish={(values) => void handleFinish(values)}
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
          <Form.Item label="题干" name="title" rules={[{ required: true, message: '请输入题干' }]}>
            <Input maxLength={1000} showCount placeholder="输入题干" />
          </Form.Item>

          <Form.Item label="所属课程" name="courseId" rules={[{ required: true, message: '请选择课程' }]}>
            <Select
              showSearch
              placeholder="选择课程"
              optionFilterProp="label"
              options={courses.map((course) => ({
                label: course.title,
                value: course.id,
              }))}
            />
          </Form.Item>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
          <Form.Item label="题型" name="type" rules={[{ required: true, message: '请选择题型' }]}>
            <Select
              options={[
                { label: '单选题', value: 'single_choice' },
                { label: '多选题', value: 'multi_choice' },
                { label: '填空题', value: 'fill_text' },
                { label: '简答题', value: 'rich_text' },
              ]}
            />
          </Form.Item>

          <Form.Item label="分值" name="score" rules={[{ required: true, message: '请输入分值' }]}>
            <InputNumber min={0} max={1000} precision={0} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item label="补充说明" name="description">
          <Input.TextArea rows={2} maxLength={2000} showCount placeholder="可选" />
        </Form.Item>

        {isChoiceType(questionType) ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <Form.List
              name="options"
              rules={[
                {
                  validator: async (_, value: QuestionBankOption[] | undefined) => {
                    if (!value || value.length < 2) {
                      throw new Error('至少保留两个选项')
                    }
                    if (value.some((item) => !item?.key?.trim() || !item?.label?.trim())) {
                      throw new Error('选项键值和内容不能为空')
                    }
                    const keySet = new Set<string>()
                    for (const item of value) {
                      const key = item.key.trim()
                      if (keySet.has(key)) {
                        throw new Error('选项键值不能重复')
                      }
                      keySet.add(key)
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <Form.Item label="选项" required className="mb-0">
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        className="grid w-full grid-cols-[88px_minmax(0,1fr)_40px] items-start gap-3"
                      >
                        <Form.Item
                          name={[field.name, 'key']}
                          className="mb-0"
                          rules={[{ required: true, message: '键值必填' }]}
                        >
                          <Input placeholder={`选项 ${index + 1}`} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'label']}
                          className="mb-0"
                          rules={[{ required: true, message: '内容必填' }]}
                        >
                          <Input placeholder="输入选项内容" />
                        </Form.Item>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          disabled={fields.length <= 2}
                          onClick={() => remove(field.name)}
                        />
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => add({ key: '', label: '' })}
                    >
                      添加选项
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </div>
                </Form.Item>
              )}
            </Form.List>

            <div className="space-y-5">
              {questionType === 'single_choice' ? (
                <Form.Item
                  label="参考答案"
                  name="singleAnswer"
                  rules={[{ required: true, message: '请选择正确答案' }]}
                >
                  <Select placeholder="选择正确选项" options={answerOptions} />
                </Form.Item>
              ) : null}

              {questionType === 'multi_choice' ? (
                <Form.Item
                  label="参考答案"
                  name="multiAnswer"
                  rules={[
                    {
                      validator: async (_, value: string[] | undefined) => {
                        if (!value?.length) {
                          throw new Error('至少选择一个正确答案')
                        }
                      },
                    },
                  ]}
                >
                  <Checkbox.Group options={answerOptions} className="grid gap-2" />
                </Form.Item>
              ) : null}

              <Form.Item label="题目解析" name="analysis" className="mb-0">
                <Input.TextArea rows={8} maxLength={4000} showCount placeholder="可选" />
              </Form.Item>
            </div>
          </div>
        ) : null}

        {questionType === 'fill_text' || questionType === 'rich_text' ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Form.Item
              label="参考答案"
              name="textAnswer"
              rules={[{ required: true, message: '请输入参考答案' }]}
            >
              <Input.TextArea rows={7} maxLength={4000} showCount placeholder="输入参考答案" />
            </Form.Item>

            <Form.Item label="题目解析" name="analysis">
              <Input.TextArea rows={7} maxLength={4000} showCount placeholder="可选" />
            </Form.Item>
          </div>
        ) : null}
      </Form>
    </Modal>
  )
}
