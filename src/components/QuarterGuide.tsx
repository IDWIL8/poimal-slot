import { CalendarRange, CheckCircle2, Clock3, ListChecks } from 'lucide-react'

const items = [
  { icon: CalendarRange, title: 'Один раз на квартал', text: 'Выбранный слот закрепляется за вами на весь квартал.' },
  { icon: Clock3, title: '45 минут вместе', text: 'Бронируется час: ещё 15 минут остаются на заметки.' },
  { icon: ListChecks, title: 'Структура встречи', text: 'Вопросы · цели и backlog · команда · коучинг.' },
  { icon: CheckCircle2, title: 'Что подготовить', text: 'Backlog · цели квартала · вопросы для обсуждения.' },
]

export function QuarterGuide() {
  return <div className="grid gap-2 sm:grid-cols-2">{items.map((item) => <article key={item.title} className="rounded-2xl border border-black/[.06] bg-white/60 p-2.5 backdrop-blur dark:border-white/[.08] dark:bg-white/[.05]"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-lime text-ink"><item.icon size={12} /></span><h2 className="text-[10px] font-extrabold">{item.title}</h2></div><p className="mt-1.5 text-[9px] font-medium leading-3.5 text-black/45 dark:text-white/45">{item.text}</p></article>)}</div>
}
