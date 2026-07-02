import { ArrowLeftRight, UsersRound } from 'lucide-react'
import type { Slot } from '../types'

const weekNames = { 1: 'Планирование спринта', 2: 'Спринт-ревью' }

export function PublicRoster({ slots }: { slots: Slot[] }) {
  const booked = slots.filter((slot) => slot.status !== 'available' && slot.bookedBy)
  return (
    <section>
      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-black/[.06] p-3 dark:border-white/[.07]">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue text-ink"><UsersRound size={17} /></span><div><h2 className="text-sm font-extrabold">Кто уже записался</h2><p className="text-[10px] text-black/40 dark:text-white/40">Имена видны всем, чтобы при необходимости можно было договориться и поменяться.</p></div></div>
          <span className="inline-flex items-center gap-2 text-[9px] font-bold text-black/40 dark:text-white/40"><ArrowLeftRight size={12} /> После договорённости измените слот по личной ссылке</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left">
            <thead className="bg-black/[.025] text-[8px] font-extrabold uppercase tracking-wider text-black/35 dark:bg-white/[.025] dark:text-white/35"><tr><th className="w-[27%] px-2.5 py-2">Участник</th><th className="w-[28%] px-2.5 py-2">Неделя</th><th className="w-[20%] px-2.5 py-2">День</th><th className="w-[25%] px-2.5 py-2">Время</th></tr></thead>
            <tbody>{booked.map((slot) => <tr key={slot.id} className="border-t border-black/[.05] text-[9px] dark:border-white/[.06]"><td className="truncate px-2.5 py-2 font-extrabold">{slot.bookedBy}</td><td className="px-2.5 py-2 font-semibold leading-3 text-black/55 dark:text-white/55">{weekNames[slot.week]}</td><td className="truncate px-2.5 py-2 text-black/45 dark:text-white/45">{slot.dayName}</td><td className="px-2.5 py-2 font-extrabold">{slot.time}</td></tr>)}</tbody>
          </table>
          {booked.length === 0 && <p className="p-8 text-center text-xs font-bold text-black/35 dark:text-white/35">Пока никто не записался — можно выбирать первым.</p>}
        </div>
      </div>
    </section>
  )
}
