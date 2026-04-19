import type { QuestionType } from '@/features/question-bank/types/question-bank'
import { questionTypeTextMap } from '@/features/question-bank/components/question-bank-page/utils'

interface QuestionBankStatsAsideProps {
  selectedCourseTitle: string
  currentPageTypeCountMap: Record<QuestionType, number>
}

export default function QuestionBankStatsAside({
  selectedCourseTitle,
  currentPageTypeCountMap,
}: QuestionBankStatsAsideProps) {
  return (
    <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-900">题型统计</h2>
        <div className="text-sm text-stone-500">{selectedCourseTitle}</div>
      </div>
      <div className="mt-4 space-y-2.5">
        {(['single_choice', 'multi_choice', 'fill_text', 'rich_text'] as QuestionType[]).map((type) => (
          <div
            key={type}
            className="flex items-center justify-between rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-3 text-sm"
          >
            <span className="text-stone-600">{questionTypeTextMap[type]}</span>
            <strong className="text-stone-900">{currentPageTypeCountMap[type]}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
