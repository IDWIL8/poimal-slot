import { motion } from 'framer-motion'
import { Check, Clock3, Leaf, MessagesSquare, Sparkles, Target, Users } from 'lucide-react'

const structure = [
  { n: '01', title: 'Ваши вопросы', text: 'Всё, что хочется спросить, обсудить или разложить по полочкам.', icon: MessagesSquare, tone: 'bg-[#fff0c9]' },
  { n: '02', title: 'Цели & Backlog', text: 'Декомпозиция, приоритизация, планирование и продуктовые упражнения.', icon: Target, tone: 'bg-sage' },
  { n: '03', title: 'Работа с командой', text: 'Лидерство, делегирование, коммуникация и стейкхолдеры.', icon: Users, tone: 'bg-blue' },
  { n: '04', title: 'Коучинг', text: 'Мотивация, саморегуляция, личный рост и честный взгляд на ситуацию.', icon: Sparkles, tone: 'bg-[#f1e3f4]' },
]

export function InfoSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
      <div className="relative overflow-hidden rounded-[36px] bg-ink p-7 text-white shadow-soft dark:bg-[#090a08] sm:p-10 lg:p-14">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
        <div className="relative grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow !text-white/40">Как всё устроено</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">45 минут —<br />по существу.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/55">Вы бронируете час. 45 минут — разговор, а оставшиеся 15 минут Инга бережёт для заметок, подготовки и чашки чая с мятой. Поэтому встреч всего три в день.</p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"><Clock3 className="text-lime" size={19} /><span className="text-sm font-bold">45 минут вместе · 15 минут на осмысление</span></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {structure.map((item, index) => (
              <motion.article key={item.n} initial={{ opacity: 0, scale: .97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * .06 }} className="rounded-[24px] bg-white/[.07] p-5 transition hover:bg-white/[.1]">
                <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone} text-ink`}><item.icon size={18} /></span><span className="text-xs font-extrabold text-white/25">{item.n}</span></div>
                <h3 className="mt-5 font-extrabold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-white/50">{item.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <div className="surface p-7 sm:p-9"><p className="eyebrow">Перед встречей</p><h3 className="mt-3 text-2xl font-extrabold tracking-tight">Пожалуйста, подготовьте</h3><div className="mt-6 grid gap-3 sm:grid-cols-2">{['Product backlog', 'Цели на квартал', 'Вопросы для обсуждения', 'Хорошее настроение (опционально 😄)'].map((text) => <div key={text} className="flex items-center gap-3 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-sage text-ink"><Check size={15} /></span>{text}</div>)}</div></div>
        <div className="flex min-h-56 flex-col justify-between rounded-[28px] bg-lime p-7 text-ink shadow-soft sm:p-9"><Leaf size={28} /><div><p className="text-2xl font-extrabold tracking-tight">Чай с мятой — Ингин.<br />Вопросы — ваши.</p><p className="mt-2 text-xs font-bold text-black/45">Кажется, честная сделка.</p></div></div>
      </div>
    </section>
  )
}
