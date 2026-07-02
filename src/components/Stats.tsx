import { motion } from 'framer-motion'
import { AnimatedNumber } from './AnimatedNumber'

export function Stats({ booked, total }: { booked: number; total: number }) {
  const values = [
    { label: 'Всего слотов', value: total, color: 'bg-lime' },
    { label: 'Уже занято', value: booked, color: 'bg-[#ffc9bb]' },
    { label: 'Можно поймать', value: total - booked, color: 'bg-sage' },
    { label: 'Заполнено', value: Math.round((booked / total) * 100), suffix: '%', color: 'bg-blue' },
  ]
  return (
    <section aria-label="Статистика записи">
      <div className="grid grid-cols-2 overflow-hidden rounded-[22px] border border-black/[.07] bg-white/65 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[.05] lg:grid-cols-4">
        {values.map((item, index) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }} className="relative border-b border-r border-black/[.06] p-3.5 last:border-r-0 dark:border-white/[.07] lg:border-b-0">
            <span className={`absolute right-3.5 top-3.5 h-2 w-2 rounded-full ${item.color}`} />
            <p className="text-[10px] font-bold text-black/40 dark:text-white/40">{item.label}</p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-[-.05em]"><AnimatedNumber value={item.value} suffix={item.suffix} /></p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
