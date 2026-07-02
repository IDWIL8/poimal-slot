import { motion } from 'framer-motion'
import { ArrowLeft, CalendarClock, Check, Clock3, LoaderCircle, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { slotById } from '../lib/slots'
import { cancelBooking, getBooking, moveBooking, updateBooking } from '../services/bookingService'
import { useSlots } from '../hooks/useSlots'
import type { Booking } from '../types'

export function ManagePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { slots } = useSlots()
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined)
  const [goal, setGoal] = useState('')
  const [changing, setChanging] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { getBooking(token).then((item) => { setBooking(item); setGoal(item?.developmentGoal || '') }) }, [token])
  const current = booking ? slotById(booking.slotId) : null

  async function saveGoal() {
    setBusy(true)
    try { await updateBooking(token, { developmentGoal: goal }); setBooking((value) => value ? { ...value, developmentGoal: goal } : value); toast.success('Тема встречи обновлена') }
    catch { toast.error('Не удалось сохранить изменения') } finally { setBusy(false) }
  }
  async function move(slotId: string) {
    setBusy(true)
    try { await moveBooking(token, slotId); const item = await getBooking(token); setBooking(item); setChanging(false); toast.success('Встреча перенесена') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось перенести') } finally { setBusy(false) }
  }
  async function cancel() {
    if (!confirm('Точно отменить встречу? Слот сразу станет доступен другим.')) return
    setBusy(true)
    try { await cancelBooking(token); toast.success('Запись отменена'); navigate('/') } catch { toast.error('Не удалось отменить запись') } finally { setBusy(false) }
  }

  if (booking === undefined) return <div className="grid min-h-[70vh] place-items-center"><LoaderCircle className="animate-spin text-black/30" /></div>
  if (!booking) return <section className="mx-auto max-w-xl px-5 py-24 text-center"><div className="surface p-10"><p className="text-5xl">🫥</p><h1 className="mt-5 text-3xl font-extrabold">Запись не найдена</h1><p className="mt-3 text-sm text-black/45 dark:text-white/45">Возможно, встреча была отменена или ссылка немного устала.</p><Link to="/" className="button-primary mt-7"><ArrowLeft size={16} /> Найти новый слот</Link></div></section>

  return (
    <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"><ArrowLeft size={15} /> Назад к расписанию</Link>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="surface p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5"><div><p className="eyebrow">Ваша встреча</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Привет, {booking.fullName.split(' ')[0]}!</h1></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue text-ink"><Check size={20} /></span></div>
          {current && <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-black/[.035] p-4 dark:bg-white/5"><CalendarClock size={18} className="mb-3 text-black/35 dark:text-white/35" /><p className="text-sm font-extrabold">{current.week === 1 ? 'Планирование спринта' : 'Спринт-ревью'}</p><p className="mt-1 text-xs font-bold text-black/40 dark:text-white/40">{current.dayName} · весь квартал</p></div><div className="rounded-2xl bg-lime/65 p-4 text-ink"><Clock3 size={18} className="mb-3" /><p className="text-sm font-extrabold">{current.time}</p><p className="mt-1 text-xs font-bold text-black/45">45 минут разговора</p></div></div>}
          <label className="mt-7 block text-sm font-extrabold">Что хотите развить в этом квартале?<textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={5} className="field mt-2 resize-none" placeholder="Приоритизация, лидерство, коммуникация…" /></label>
          <button disabled={busy || goal === booking.developmentGoal} onClick={saveGoal} className="button-primary mt-4"><Save size={16} /> Сохранить тему</button>
        </motion.div>
        <div className="space-y-5">
          <div className="surface p-6"><p className="eyebrow">Планы изменились?</p><h2 className="mt-3 text-xl font-extrabold">Это нормально.</h2><p className="mt-2 text-xs leading-5 text-black/45 dark:text-white/45">Перенесите встречу на любой свободный слот — личные данные заполнять заново не придётся.</p><button onClick={() => setChanging(!changing)} className="button-secondary mt-5 w-full"><CalendarClock size={16} /> {changing ? 'Скрыть слоты' : 'Изменить время'}</button></div>
          <div className="rounded-[28px] border border-red-500/10 bg-red-500/[.04] p-6"><p className="text-sm font-extrabold">Отменить встречу</p><p className="mt-1 text-xs text-black/40 dark:text-white/40">Слот снова станет доступен всем.</p><button disabled={busy} onClick={cancel} className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-red-500 hover:text-red-600"><Trash2 size={15} /> Отменить запись</button></div>
        </div>
      </div>
      {changing && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface mt-5 p-6 sm:p-8"><h2 className="text-xl font-extrabold">Выберите новое время</h2><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{slots.filter((slot) => slot.status === 'available').map((slot) => <button disabled={busy} key={slot.id} onClick={() => move(slot.id)} className="rounded-2xl border border-[#b6cfaa] bg-[#edf5e9] p-4 text-left text-ink transition hover:-translate-y-0.5 hover:shadow-md"><span className="block text-xs font-bold text-black/40">Неделя {slot.week} · {slot.dayShort}</span><span className="mt-1 block text-sm font-extrabold">{slot.time}</span></button>)}</div></motion.div>}
    </section>
  )
}
