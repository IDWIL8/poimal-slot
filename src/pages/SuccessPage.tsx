import { motion } from 'framer-motion'
import { CalendarDays, Check, Clock3, Copy, ExternalLink, PartyPopper } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { slotById } from '../lib/slots'
import { getBooking } from '../services/bookingService'
import type { Booking } from '../types'

const messages = ['Инга уже заваривает чай с мятой 🌿', 'Отличный выбор 😄', 'До встречи!', 'Календарный квест пройден.']

export function SuccessPage() {
  const { token = '' } = useParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const message = useMemo(() => messages[Math.floor(Math.random() * messages.length)], [])
  useEffect(() => { getBooking(token).then(setBooking) }, [token])
  const slot = booking ? slotById(booking.slotId) : null
  const link = `${window.location.origin}/manage/${token}`
  const particles = useMemo(() => Array.from({ length: 28 }, (_, index) => ({ id: index, x: (Math.random() - .5) * 700, y: Math.random() * 400 + 80, rotate: Math.random() * 500, color: ['#dff26d', '#ff8e72', '#9ec3ed', '#e9c4ef'][index % 4] })), [])

  return (
    <section className="relative mx-auto flex min-h-[78vh] max-w-5xl items-center justify-center overflow-hidden px-5 py-16 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center">{particles.map((p) => <motion.i key={p.id} className="absolute h-2 w-4 rounded-sm" style={{ background: p.color }} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate }} transition={{ duration: 2.2, delay: Math.random() * .5, ease: 'easeOut' }} />)}</div>
      <motion.div initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface relative w-full max-w-2xl p-6 text-center sm:p-10">
        <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: .15 }} className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-lime text-ink shadow-lg shadow-lime/25"><Check size={38} strokeWidth={3} /></motion.div>
        <p className="eyebrow mt-7">Готово. Время закреплено</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Ваш слот на квартал выбран!</h1>
        <p className="mt-3 font-serif text-xl italic text-black/45 dark:text-white/45">{message}</p>
        {slot && <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2"><div className="rounded-2xl bg-black/[.035] p-4 dark:bg-white/[.05]"><CalendarDays size={18} className="mb-3 text-black/35 dark:text-white/35" /><p className="text-xs font-bold text-black/40 dark:text-white/40">{slot.week === 1 ? 'Планирование спринта' : 'Спринт-ревью'}</p><p className="mt-1 text-sm font-extrabold">{slot.dayName} · весь квартал</p></div><div className="rounded-2xl bg-black/[.035] p-4 dark:bg-white/[.05]"><Clock3 size={18} className="mb-3 text-black/35 dark:text-white/35" /><p className="text-xs font-bold text-black/40 dark:text-white/40">Постоянное время</p><p className="mt-1 text-sm font-extrabold">{slot.time}</p></div></div>}
        <div className="mt-5 rounded-2xl border border-dashed border-black/15 p-4 text-left dark:border-white/15"><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/35 dark:text-white/35">Личная ссылка для управления</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-xs font-bold">{link}</code><button onClick={() => navigator.clipboard.writeText(link).then(() => toast.success('Ссылка скопирована'))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10" aria-label="Скопировать ссылку"><Copy size={15} /></button></div></div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link to={`/manage/${token}`} className="button-primary">Управлять записью <ExternalLink size={16} /></Link><Link to="/" className="button-secondary"><PartyPopper size={16} /> На главную</Link></div>
      </motion.div>
    </section>
  )
}
