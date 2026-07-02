import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, CalendarDays, Clock3, X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { BookingFormData, Slot } from '../types'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Напишите ваше имя'),
  team: z.string().trim().min(2, 'Укажите команду'),
  developmentGoal: z.string(),
  agreement: z.literal(true, { errorMap: () => ({ message: 'Нужно согласиться с правилами' }) }),
})

interface Props { slot: Slot | null; onClose: () => void; onSubmit: (data: BookingFormData) => Promise<void>; submitting: boolean }

export function BookingModal({ slot, onClose, onSubmit, submitting }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<BookingFormData>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { fullName: '', team: '', developmentGoal: '', agreement: false } })
  useEffect(() => { if (!slot) reset() }, [slot, reset])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {slot && (
        <motion.div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="booking-title" initial={{ opacity: 0, y: 30, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} className="max-h-[96vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-[#fbfaf7] p-5 shadow-2xl dark:bg-[#20211d] sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow">Финишная прямая</p><h2 id="booking-title" className="mt-1.5 text-2xl font-extrabold tracking-[-.04em]">Забронировать встречу</h2></div>
              <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 transition hover:rotate-6 hover:bg-black/10 dark:bg-white/10" aria-label="Закрыть"><X size={18} /></button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-lime/80 px-3.5 py-2 text-[11px] font-extrabold text-ink"><CalendarDays size={14} /> {slot.week === 1 ? 'Планирование спринта' : 'Спринт-ревью'} · {slot.dayName}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue px-3.5 py-2 text-[11px] font-extrabold text-ink"><Clock3 size={14} /> {slot.time}</span>
            </div>
            <section aria-labelledby="booking-rules-title" className="mt-4 rounded-2xl border border-[#eadc9e] bg-[#fff7d9] p-3.5 text-ink dark:border-[#6c623a] dark:bg-[#302d20] dark:text-white">
              <div className="flex items-center gap-2"><BookOpen size={15} className="text-[#8a7623] dark:text-lime" /><h3 id="booking-rules-title" className="text-xs font-extrabold">Правила записи</h3></div>
              <ul className="mt-2 grid gap-x-5 gap-y-1.5 text-[10px] font-semibold leading-4 text-black/55 dark:text-white/55 sm:grid-cols-2">
                <li>• Один человек выбирает один слот на весь квартал.</li>
                <li>• Бронируется час, сама встреча длится 45 минут.</li>
                <li>• Пожалуйста, приходите вовремя.</li>
                <li>• Перенос и отмена доступны по личной ссылке.</li>
              </ul>
            </section>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="text-xs font-bold">Ваше имя <span className="text-coral">*</span><input autoFocus {...register('fullName')} className="field mt-1.5 !py-2.5" placeholder="Например, Анна Смирнова" />{errors.fullName && <span className="mt-1 block text-[10px] text-red-500">{errors.fullName.message}</span>}</label>
                <label className="text-xs font-bold">Команда <span className="text-coral">*</span><input {...register('team')} className="field mt-1.5 !py-2.5" placeholder="Например, Product Core" />{errors.team && <span className="mt-1 block text-[10px] text-red-500">{errors.team.message}</span>}</label>
              </div>
              <label className="block text-xs font-bold">Что хотите развить в этом квартале?<span className="ml-2 font-medium text-black/35 dark:text-white/35">необязательно</span><textarea {...register('developmentGoal')} rows={2} className="field mt-1.5 resize-none !py-2.5" placeholder="Приоритизация, лидерство, коммуникация, Product Discovery…" /></label>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-black/[.07] bg-white/70 p-3 text-[11px] font-medium leading-4 dark:border-white/10 dark:bg-white/5">
                <input {...register('agreement')} type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#252621]" />
                <span>Я прочитал(а) правила записи выше и согласен(на) с ними.</span>
              </label>
              <button disabled={!isValid || submitting} className="button-primary w-full py-3.5">{submitting ? 'Бережно бронируем…' : 'Забронировать этот слот'} {!submitting && <ArrowRight size={17} />}</button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
