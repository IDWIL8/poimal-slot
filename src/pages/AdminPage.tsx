import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Database, Download, Edit3, LoaderCircle, LogIn, LogOut, RefreshCw, Search, ShieldCheck, UserX, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { adminEmail, auth, firebaseEnabled, googleProvider } from '../lib/firebase'
import { createSlots, slotById } from '../lib/slots'
import { adminDeleteBooking, getSyncDiagnostics, isActiveBooking, listBookings, moveBooking, repairBookingIndexes, saveAdminNotes, updateBooking, type SyncDiagnostics } from '../services/bookingService'
import type { AdminNotes, Booking } from '../types'

const emptyNotes: AdminNotes = { completed: false, discussionNotes: '', actionItems: '', homework: '', followUp: '', progressRating: 3, nextTopics: '' }

export function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [demoAccess, setDemoAccess] = useState(false)
  const [authLoading, setAuthLoading] = useState(firebaseEnabled)
  const allowed = demoAccess || Boolean(user && user.email?.toLowerCase() === adminEmail)
  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setAuthLoading(false) })
  }, [])

  async function login() {
    if (!auth) { setDemoAccess(true); return }
    try {
      const result = await signInWithPopup(auth, googleProvider)
      if (result.user.email?.toLowerCase() !== adminEmail) { await signOut(auth); toast.error('У этого аккаунта нет доступа') }
    } catch { toast.error('Не удалось войти через Google') }
  }

  if (authLoading) return <div className="grid min-h-[70vh] place-items-center"><LoaderCircle className="animate-spin text-black/30" /></div>
  if (!allowed) return <section className="mx-auto flex min-h-[72vh] max-w-lg items-center px-5 py-16"><div className="surface w-full p-8 text-center sm:p-10"><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-lime text-ink"><ShieldCheck size={29} /></span><p className="eyebrow mt-7">Закрытая территория</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight">Панель Инги</h1><p className="mt-3 text-sm leading-6 text-black/45 dark:text-white/45">Здесь живут записи, статистика и личные заметки. Вход только для администратора.</p><button onClick={login} className="button-primary mt-7 w-full"><LogIn size={17} /> {firebaseEnabled ? 'Войти через Google' : 'Открыть демо-панель'}</button>{firebaseEnabled && <p className="mt-4 text-[10px] text-black/30 dark:text-white/30">Доступ: {adminEmail || 'email не настроен'}</p>}</div></section>
  return <AdminDashboard onLogout={() => auth ? signOut(auth) : setDemoAccess(false)} />
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [week, setWeek] = useState('all')
  const [sort, setSort] = useState<'slot' | 'name'>('slot')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [diagnostics, setDiagnostics] = useState<SyncDiagnostics | null>(null)
  const [syncing, setSyncing] = useState(false)

  async function refresh(autoRepair = true) {
    setLoading(true)
    try {
      const [allBookings, currentDiagnostics] = await Promise.all([listBookings(), getSyncDiagnostics()])
      setBookings(allBookings)
      setDiagnostics(currentDiagnostics)
      const repairable = currentDiagnostics.missingClaimTokens.length + currentDiagnostics.missingIdentityTokens.length + currentDiagnostics.orphanClaimIds.length + currentDiagnostics.orphanIdentityIds.length + currentDiagnostics.legacyClaimIds.length + currentDiagnostics.legacyBookingTokens.length
      if (autoRepair && repairable > 0) {
        setSyncing(true)
        const repaired = await repairBookingIndexes()
        setDiagnostics(repaired)
        setBookings(await listBookings())
        toast.success('Индексы бронирований синхронизированы')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить диагностику')
    } finally { setLoading(false); setSyncing(false) }
  }
  useEffect(() => { refresh() }, [])
  const activeBookings = useMemo(() => bookings.filter(isActiveBooking), [bookings])
  const rows = useMemo(() => bookings.filter((booking) => {
    const slot = slotById(booking.slotId)
    const matchText = `${booking.fullName} ${booking.team} ${booking.developmentGoal}`.toLowerCase().includes(query.toLowerCase())
    return matchText && (week === 'all' || slot?.week === Number(week))
  }).sort((a, b) => sort === 'name' ? a.fullName.localeCompare(b.fullName) : a.slotId.localeCompare(b.slotId)), [bookings, query, week, sort])

  const chartData = useMemo(() => {
    const slots = createSlots()
    return [...new Set(slots.map((slot) => slot.dayKey))].map((key) => {
      const daySlots = slots.filter((slot) => slot.dayKey === key)
      return { name: `${daySlots[0].week === 1 ? 'План.' : 'Ревью'} ${daySlots[0].dayName.slice(0, 2)}`, занято: activeBookings.filter((booking) => daySlots.some((slot) => slot.id === slotById(booking.slotId)?.id)).length, всего: 3 }
    })
  }, [activeBookings])
  const bookedWeek1 = activeBookings.filter((booking) => slotById(booking.slotId)?.week === 1).length
  const bookedWeek2 = activeBookings.filter((booking) => slotById(booking.slotId)?.week === 2).length

  function exportCSV() {
    const headers = ['Name', 'Team', 'Status', 'Week', 'Day', 'Time', 'Development goal']
    const lines = bookings.map((booking) => { const slot = slotById(booking.slotId); return [booking.fullName, booking.team, booking.status || 'active', slot?.week, slot?.dayName, slot?.time, booking.developmentGoal].map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',') })
    const blob = new Blob([`\uFEFF${[headers.join(','), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = 'coaching-bookings.csv'; anchor.click(); URL.revokeObjectURL(anchor.href)
  }
  async function remove(booking: Booking) { if (!confirm(`Отменить запись ${booking.fullName}? Документ останется в истории.`)) return; await adminDeleteBooking(booking.token); toast.success('Запись отменена, история сохранена'); refresh(false) }
  async function repair() { setSyncing(true); try { setDiagnostics(await repairBookingIndexes()); setBookings(await listBookings()); toast.success('Синхронизация завершена') } catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось синхронизировать') } finally { setSyncing(false) } }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Администратор</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Добрый день, Инга.</h1><p className="mt-2 text-sm text-black/40 dark:text-white/40">Слоты ведут себя прилично. Пока что.</p></div><div className="flex gap-2"><button onClick={exportCSV} className="button-secondary"><Download size={16} /> CSV</button><button onClick={onLogout} className="grid h-11 w-11 place-items-center rounded-full border border-black/10 dark:border-white/10" aria-label="Выйти"><LogOut size={17} /></button></div></div>
      {diagnostics && <div className="surface mt-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-x-6 gap-y-3"><span className="flex items-center gap-2 text-xs font-bold"><Database size={15} className="text-[#6c9d58]" /> bookings: <b>{diagnostics.bookingCount}</b></span><span className="text-xs font-bold">активных: <b>{diagnostics.activeBookingCount}</b></span><span className="text-xs font-bold">slotClaims: <b>{diagnostics.claimCount}</b></span><span className="text-xs font-bold">bookingIdentities: <b>{diagnostics.identityCount}</b></span><span className={`flex items-center gap-1.5 text-xs font-extrabold ${diagnostics.missingClaimTokens.length + diagnostics.missingIdentityTokens.length + diagnostics.orphanClaimIds.length + diagnostics.orphanIdentityIds.length + diagnostics.conflictSlotIds.length + diagnostics.conflictPersonKeys.length ? 'text-red-500' : 'text-[#6c9d58]'}`}><AlertTriangle size={14} /> проблем: {diagnostics.missingClaimTokens.length + diagnostics.missingIdentityTokens.length + diagnostics.orphanClaimIds.length + diagnostics.orphanIdentityIds.length + diagnostics.conflictSlotIds.length + diagnostics.conflictPersonKeys.length}</span></div><button disabled={syncing} onClick={repair} className="button-secondary !px-4 !py-2.5"><RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Синхронизируем…' : 'Проверить и восстановить'}</button></div>}
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ['Активных записей', activeBookings.length, 'bg-lime'], ['Свободно', 18 - activeBookings.length, 'bg-sage'], ['Неделя 1', `${bookedWeek1}/9`, 'bg-blue'], ['Неделя 2', `${bookedWeek2}/9`, 'bg-[#f1e3f4]'],
      ].map(([label, value, tone]) => <div key={label} className="surface p-5"><span className={`mb-5 block h-2.5 w-2.5 rounded-full ${tone}`} /><p className="text-xs font-bold text-black/40 dark:text-white/40">{label}</p><p className="mt-1 text-3xl font-extrabold tracking-tight">{typeof value === 'number' ? <AnimatedNumber value={value} /> : value}</p></div>)}</div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
        <div className="surface min-h-80 p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Заполняемость по дням</p><p className="mt-1 text-xs text-black/35 dark:text-white/35">Максимум 3 встречи в день</p></div></div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="adminArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#93ad55" stopOpacity={.5}/><stop offset="95%" stopColor="#93ad55" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(128,128,128,.12)" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} /><YAxis domain={[0, 3]} ticks={[0,1,2,3]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 16, border: 0, boxShadow: '0 12px 30px rgba(0,0,0,.12)' }} /><Area type="monotone" dataKey="занято" stroke="#7d9842" strokeWidth={3} fill="url(#adminArea)" /></AreaChart></ResponsiveContainer></div></div>
        <div className="rounded-[28px] bg-ink p-7 text-white dark:bg-[#090a08]"><Users className="text-lime" /><p className="mt-10 text-5xl font-extrabold tracking-[-.06em]"><AnimatedNumber value={Math.round((activeBookings.length / 18) * 100)} suffix="%" /></p><p className="mt-2 text-sm font-bold">общая заполняемость</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${activeBookings.length / 18 * 100}%` }} className="h-full rounded-full bg-lime" /></div><p className="mt-4 text-xs text-white/40">Осталось {18 - activeBookings.length} слотов из 18</p></div>
      </div>
      <div className="surface mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-black/[.06] p-4 dark:border-white/[.07] sm:flex-row"><label className="relative flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="field !py-3 !pl-11" placeholder="Имя, команда или тема…" /></label><select value={week} onChange={(e) => setWeek(e.target.value)} className="field sm:w-40"><option value="all">Все недели</option><option value="1">Неделя 1</option><option value="2">Неделя 2</option></select><select value={sort} onChange={(e) => setSort(e.target.value as 'slot' | 'name')} className="field sm:w-44"><option value="slot">По времени</option><option value="name">По имени</option></select></div>
        {loading ? <div className="grid h-52 place-items-center"><LoaderCircle className="animate-spin text-black/30" /></div> : rows.length === 0 ? <div className="p-14 text-center"><p className="text-3xl">🗓️</p><p className="mt-3 text-sm font-extrabold">Ничего не найдено</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-black/[.025] text-[10px] uppercase tracking-wider text-black/35 dark:bg-white/[.025] dark:text-white/35"><tr><th className="px-5 py-3">Участник</th><th className="px-5 py-3">Постоянный слот</th><th className="px-5 py-3">Тема</th><th className="px-5 py-3">Статус</th><th className="px-5 py-3" /></tr></thead><tbody>{rows.map((booking) => { const slot = slotById(booking.slotId); const active = isActiveBooking(booking); return <tr key={booking.token} className={`border-t border-black/[.05] dark:border-white/[.06] ${active ? '' : 'opacity-55'}`}><td className="px-5 py-4"><p className="font-extrabold">{booking.fullName}</p><p className="mt-1 text-xs text-black/35 dark:text-white/35">{booking.team}</p></td><td className="px-5 py-4"><p className="text-xs font-bold">{slot?.dayName} · {slot?.time}</p><p className="mt-1 text-[10px] text-black/35 dark:text-white/35">{slot?.week === 1 ? 'Планирование спринта' : 'Спринт-ревью'}</p></td><td className="max-w-64 px-5 py-4 text-xs text-black/55 dark:text-white/55">{booking.developmentGoal || '—'}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${!active ? 'bg-red-100 text-red-600' : booking.notes?.completed ? 'bg-sage text-ink' : 'bg-[#fff0c9] text-ink'}`}>{!active ? 'Отменена' : booking.notes?.completed ? 'Проведена' : 'Активна'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button disabled={!active} onClick={() => setSelected(booking)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 disabled:opacity-25 dark:hover:bg-white/10" aria-label="Редактировать"><Edit3 size={15} /></button><button disabled={!active} onClick={() => remove(booking)} className="grid h-9 w-9 place-items-center rounded-full text-red-400 hover:bg-red-500/10 disabled:opacity-25" aria-label="Отменить"><UserX size={15} /></button></div></td></tr> })}</tbody></table></div>}
      </div>
      {selected && <BookingEditor booking={selected} bookings={bookings} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); refresh() }} />}
    </section>
  )
}

function BookingEditor({ booking, bookings, onClose, onSaved }: { booking: Booking; bookings: Booking[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ fullName: booking.fullName, team: booking.team, developmentGoal: booking.developmentGoal })
  const [slotId, setSlotId] = useState(booking.slotId)
  const [notes, setNotes] = useState<AdminNotes>(booking.notes || emptyNotes)
  const [busy, setBusy] = useState(false)
  const occupied = new Set(bookings.filter((item) => item.token !== booking.token && isActiveBooking(item)).map((item) => slotById(item.slotId)?.id || item.slotId))
  async function save() {
    setBusy(true)
    try { await updateBooking(booking.token, form); if (slotId !== booking.slotId) await moveBooking(booking.token, slotId); await saveAdminNotes(booking.token, notes); toast.success('Изменения сохранены'); onSaved() } catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось сохранить') } finally { setBusy(false) }
  }
  const noteFields: Array<[keyof AdminNotes, string]> = [['discussionNotes', 'Заметки обсуждения'], ['actionItems', 'Следующие шаги'], ['homework', 'Домашнее задание'], ['followUp', 'Follow-up'], ['nextTopics', 'Темы на будущее']]
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><motion.aside initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="h-full w-full max-w-xl overflow-y-auto bg-[#fbfaf7] p-6 shadow-2xl dark:bg-[#20211d] sm:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow">Карточка участника</p><h2 className="mt-2 text-2xl font-extrabold">{booking.fullName}</h2></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/5 dark:bg-white/10"><X size={18} /></button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Имя<input className="field mt-2" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label><label className="text-xs font-bold">Команда<input className="field mt-2" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} /></label></div><label className="mt-4 block text-xs font-bold">Тема<textarea className="field mt-2 resize-none" rows={3} value={form.developmentGoal} onChange={(e) => setForm({ ...form, developmentGoal: e.target.value })} /></label><label className="mt-4 block text-xs font-bold">Слот<select className="field mt-2" value={slotById(slotId)?.id || slotId} onChange={(e) => setSlotId(e.target.value)}>{createSlots().filter((slot) => !occupied.has(slot.id)).map((slot) => <option value={slot.id} key={slot.id}>{slot.week === 1 ? 'Планирование спринта' : 'Спринт-ревью'} · {slot.dayName} · {slot.time}</option>)}</select></label><div className="my-7 h-px bg-black/[.07] dark:bg-white/10" /><div className="flex items-center justify-between"><div><p className="eyebrow">Личные заметки</p><p className="mt-1 text-[10px] text-black/35 dark:text-white/35">Видны только администратору</p></div><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={notes.completed} onChange={(e) => setNotes({ ...notes, completed: e.target.checked })} /> Встреча проведена</label></div><div className="mt-5 space-y-4">{noteFields.map(([key, label]) => <label key={key} className="block text-xs font-bold">{label}<textarea className="field mt-2 resize-none" rows={2} value={String(notes[key])} onChange={(e) => setNotes({ ...notes, [key]: e.target.value })} /></label>)}<label className="block text-xs font-bold">Оценка прогресса: {notes.progressRating}/5<input type="range" min="1" max="5" value={notes.progressRating} onChange={(e) => setNotes({ ...notes, progressRating: Number(e.target.value) })} className="mt-3 w-full accent-[#7d9842]" /></label></div><button disabled={busy} onClick={save} className="button-primary mt-7 w-full">{busy ? 'Сохраняем…' : 'Сохранить карточку'}</button></motion.aside></div>
}
