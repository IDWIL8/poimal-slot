import { motion } from 'framer-motion'
import { CheckCircle2, Clock3, UserRound } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Slot } from '../types'

const weekMeta = {
  1: { title: 'Планирование спринта', description: 'Встречи в неделю планирования' },
  2: { title: 'Спринт-ревью', description: 'Встречи в неделю подведения итогов' },
}

const cardStyles = {
  available: 'border-[#b6cfaa] bg-[#edf5e9] hover:-translate-y-0.5 hover:border-[#8eae7f] dark:border-[#50654a] dark:bg-[#253023]',
  booked: 'cursor-not-allowed border-black/[.05] bg-black/[.035] dark:border-white/[.04] dark:bg-white/[.035]',
  mine: 'border-[#9abce5] bg-[#e8f1fb] hover:-translate-y-0.5 dark:border-[#425f81] dark:bg-[#1d2b39]',
}

export function BookingGrid({ slots, onSelect, onMine }: { slots: Slot[]; onSelect: (slot: Slot) => void; onMine: () => void }) {
  return (
    <section id="slots" className="scroll-mt-6">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Постоянное время на квартал</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-[-.05em]">Выберите свой слот</h2>
          <p className="mt-1 max-w-2xl text-[10px] font-medium leading-4 text-black/45 dark:text-white/45">Запись оформляется один раз: выбранное время закрепляется за вами на весь квартал.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-bold text-black/45 dark:text-white/45">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#6c9d58]" /> свободно</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-black/20 dark:bg-white/20" /> занято</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#4d82bf]" /> ваше</span>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {([1, 2] as const).map((week) => (
          <motion.article key={week} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="surface p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-extrabold text-white dark:bg-lime dark:text-ink">Неделя {week}</span>
                <div><h3 className="text-xs font-extrabold">{weekMeta[week].title}</h3><p className="text-[9px] font-medium text-black/35 dark:text-white/35">{weekMeta[week].description}</p></div>
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-3">
              {['Понедельник', 'Вторник', 'Среда'].map((dayName) => {
                const daySlots = slots.filter((slot) => slot.week === week && slot.dayName === dayName)
                return (
                  <div key={dayName} className="rounded-xl bg-black/[.025] p-1.5 dark:bg-white/[.025]">
                    <div className="flex items-center justify-between px-1 pb-1.5"><p className="text-[9px] font-extrabold">{dayName}</p><p className="text-[8px] font-bold text-black/30 dark:text-white/30">{daySlots[0]?.dayShort}</p></div>
                    <div className="space-y-1">
                      {daySlots.map((slot) => (
                        <button key={slot.id} disabled={slot.status === 'booked'} onClick={() => slot.status === 'mine' ? onMine() : onSelect(slot)} className={cn('group w-full rounded-lg border px-2 py-1.5 text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/60', cardStyles[slot.status])}>
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-extrabold tracking-[-.02em]">{slot.time}</span>
                            {slot.status === 'available' ? <Clock3 size={12} className="text-[#6c9d58]" /> : slot.status === 'mine' ? <CheckCircle2 size={12} className="text-[#4d82bf]" /> : <UserRound size={12} className="text-black/30 dark:text-white/30" />}
                          </span>
                          <span className={cn('mt-0.5 block truncate text-[8px] font-bold', slot.status === 'available' ? 'text-[#557c45]' : slot.status === 'mine' ? 'text-[#4d73a0]' : 'text-black/38 dark:text-white/38')}>
                            {slot.status === 'available' ? 'Свободно' : slot.status === 'mine' ? `Ваш слот${slot.bookedBy ? ` · ${slot.bookedBy}` : ''}` : slot.bookedBy || 'Занято'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
