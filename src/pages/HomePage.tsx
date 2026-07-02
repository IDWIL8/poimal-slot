import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, CalendarCheck, Radio, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookingGrid } from '../components/BookingGrid'
import { BookingModal } from '../components/BookingModal'
import { PublicRoster } from '../components/PublicRoster'
import { QuarterGuide } from '../components/QuarterGuide'
import { Stats } from '../components/Stats'
import { firebaseEnabled } from '../lib/firebase'
import { createBooking, myBookingToken } from '../services/bookingService'
import { useSlots } from '../hooks/useSlots'
import type { BookingFormData, Slot } from '../types'

const subtitles = ['Сегодня Инга настроена конструктивно 🌿', 'Поймал слот — поймал коуча 😄', 'Разбираем хаос по 45 минут.', 'Главное — прийти вовремя.', 'Чай с мятой уже заваривается.']

export function HomePage() {
  const navigate = useNavigate()
  const { slots, loading } = useSlots()
  const [selected, setSelected] = useState<Slot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const subtitle = useMemo(() => subtitles[Math.floor(Math.random() * subtitles.length)], [])
  const booked = slots.filter((slot) => slot.status !== 'available').length
  const mine = myBookingToken()

  async function handleBooking(data: BookingFormData) {
    if (!selected) return
    setSubmitting(true)
    try {
      const token = await createBooking(selected.id, data)
      setSelected(null)
      navigate(`/success/${token}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось забронировать слот')
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <section className="noise relative mx-auto max-w-[1500px] overflow-hidden px-5 pb-5 pt-3 sm:px-8 sm:pt-5">
        <div className="grid-fade absolute inset-0" />
        <motion.div className="absolute left-[10%] top-10 h-56 w-56 rounded-full bg-lime/40 blur-[80px] dark:bg-lime/15" animate={{ x: [0, 35, 0], y: [0, -15, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute right-[8%] top-16 h-60 w-60 rounded-full bg-[#ffb9a8]/25 blur-[90px] dark:bg-coral/10" animate={{ x: [0, -30, 0], y: [0, 22, 0] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-black/[.08] bg-white/55 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] backdrop-blur dark:border-white/10 dark:bg-white/5">
            <Radio size={13} className="text-[#6c9d58]" /> Спринт-сессии · запись открыта
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08, duration: .6 }} className="mt-3 max-w-3xl text-[clamp(2.2rem,3.8vw,3rem)] font-extrabold leading-[.92] tracking-[-.065em] lg:whitespace-nowrap">
            Поймал слот — <span className="font-serif font-semibold italic text-black/43 dark:text-white/45">поймал коуча.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }} className="mt-3 max-w-xl text-xs font-medium leading-5 text-black/50 dark:text-white/50">Один раз выберите постоянное время для индивидуальной встречи с Ингой — и оно останется вашим на весь квартал.</motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .34 }} className="mt-3 flex flex-wrap items-center gap-3">
            <a href="#slots" className="button-primary px-5 py-3">Выбрать время <ArrowDown size={15} /></a>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-black/40 dark:text-white/40"><Sparkles size={15} /> {subtitle}</span>
          </motion.div>
          {!firebaseEnabled && <div className="mt-2 inline-flex rounded-full bg-[#fff0c9]/80 px-3 py-1 text-[8px] font-bold text-ink">Демо-режим · подключите Firebase для общей записи</div>}
          </div>
          <QuarterGuide />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        {mine && <div className="mb-3 flex flex-col items-start justify-between gap-2 rounded-[18px] bg-blue p-2.5 text-ink sm:flex-row sm:items-center sm:px-3"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/60"><CalendarCheck size={14} /></span><div><p className="text-[10px] font-extrabold">Ваш постоянный слот уже выбран</p><p className="text-[9px] font-medium text-black/45">Можно изменить время, тему или отменить встречу.</p></div></div><button onClick={() => navigate(`/manage/${mine}`)} className="button-secondary !border-black/10 !bg-white/55 !px-3 !py-1.5 text-[10px]">Управлять <ArrowRight size={12} /></button></div>}
        {loading ? <div className="h-16 animate-pulse rounded-[22px] bg-black/5 dark:bg-white/5" /> : <Stats booked={booked} total={slots.length} />}
        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1.75fr_1fr]">
          <BookingGrid slots={slots} onSelect={setSelected} onMine={() => mine && navigate(`/manage/${mine}`)} />
          <PublicRoster slots={slots} />
        </div>
      </section>
      <BookingModal slot={selected} onClose={() => setSelected(null)} onSubmit={handleBooking} submitting={submitting} />
    </>
  )
}
