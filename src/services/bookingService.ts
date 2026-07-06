import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db, firebaseEnabled } from '../lib/firebase'
import { createSlots, normalizeSlotId } from '../lib/slots'
import { personFingerprint, secureToken } from '../lib/utils'
import type { AdminNotes, Booking, BookingFormData } from '../types'

const DEMO_KEY = 'coach-demo-bookings-v2'
const MY_TOKEN_KEY = 'coach-my-booking-token'
const CHANGE_EVENT = 'coach-bookings-change'

export const isActiveBooking = (booking: Booking) => booking.status !== 'cancelled'

export interface SyncDiagnostics {
  bookingCount: number
  activeBookingCount: number
  cancelledBookingCount: number
  claimCount: number
  identityCount: number
  missingClaimTokens: string[]
  missingIdentityTokens: string[]
  orphanClaimIds: string[]
  orphanIdentityIds: string[]
  conflictSlotIds: string[]
  conflictPersonKeys: string[]
  legacyClaimIds: string[]
  legacyBookingTokens: string[]
}

interface ClaimRecord {
  rawId: string
  personKey?: string
  bookedBy?: string
}

interface IdentityRecord {
  token?: string
  slotId?: string
}

const seed: Booking[] = [
  { token: 'demo-anna', slotId: '', fullName: 'Анна', team: 'Product', developmentGoal: 'Приоритизация', personKey: 'seed-anna', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-timur', slotId: '', fullName: 'Тимур', team: 'Design', developmentGoal: 'Leadership', personKey: 'seed-timur', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-lera', slotId: '', fullName: 'Лера', team: 'Growth', developmentGoal: 'Stakeholder management', personKey: 'seed-lera', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-maks', slotId: '', fullName: 'Максим', team: 'Platform', developmentGoal: 'Делегирование', personKey: 'seed-maks', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-sasha', slotId: '', fullName: 'Саша', team: 'Core', developmentGoal: 'Product strategy', personKey: 'seed-sasha', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

function demoBookings(): Booking[] {
  const saved = localStorage.getItem(DEMO_KEY)
  if (saved) return (JSON.parse(saved) as Booking[]).map((booking) => ({ ...booking, slotId: normalizeSlotId(booking.slotId), status: booking.status || 'active' }))
  const allSlots = createSlots()
  const slotIds = [0, 4, 7, 12, 16].map((index) => allSlots[index].id)
  const initial = seed.map((booking, index) => ({ ...booking, slotId: slotIds[index] }))
  localStorage.setItem(DEMO_KEY, JSON.stringify(initial))
  return initial
}

function writeDemo(bookings: Booking[]) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(bookings))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function myBookingToken() { return localStorage.getItem(MY_TOKEN_KEY) }
export function rememberBooking(token: string) { localStorage.setItem(MY_TOKEN_KEY, token) }
export function forgetBooking() { localStorage.removeItem(MY_TOKEN_KEY) }

export function subscribeToClaims(callback: (claims: Array<{ slotId: string; token?: string; bookedBy?: string }>) => void) {
  if (!firebaseEnabled || !db) {
    const notify = () => callback(demoBookings().filter(isActiveBooking).map((booking) => ({ slotId: normalizeSlotId(booking.slotId), token: booking.token, bookedBy: booking.fullName })))
    notify()
    window.addEventListener(CHANGE_EVENT, notify)
    window.addEventListener('storage', notify)
    return () => { window.removeEventListener(CHANGE_EVENT, notify); window.removeEventListener('storage', notify) }
  }
  return onSnapshot(collection(db, 'slotClaims'), (snapshot) => {
    const claimsBySlot = new Map<string, { slotId: string; bookedBy?: string }>()
    for (const item of snapshot.docs) {
      const canonicalId = normalizeSlotId(item.id)
      claimsBySlot.set(canonicalId, { slotId: canonicalId, bookedBy: item.data().bookedBy as string | undefined })
      if (canonicalId !== item.id) console.warn(`[booking-sync] Старый slotClaim ${item.id} отображён как ${canonicalId}`)
    }
    const claims = [...claimsBySlot.values()]
    console.info(`[booking-sync] Получено slotClaims: ${snapshot.size}; уникальных слотов: ${claims.length}`, claims.map((claim) => claim.slotId))
    callback(claims)
  }, (error) => console.error('[booking-sync] Не удалось загрузить slotClaims', error))
}

export async function createBooking(slotId: string, data: BookingFormData) {
  slotId = normalizeSlotId(slotId)
  const personKey = await personFingerprint(data.fullName, data.team)
  const token = secureToken()
  if (!firebaseEnabled || !db) {
    const bookings = demoBookings()
    if (bookings.some((booking) => isActiveBooking(booking) && normalizeSlotId(booking.slotId) === slotId)) throw new Error('Этот слот уже занят')
    if (bookings.some((booking) => isActiveBooking(booking) && booking.personKey === personKey)) throw new Error('У вас уже есть запись')
    const now = new Date().toISOString()
    writeDemo([...bookings, { token, slotId, fullName: data.fullName.trim(), team: data.team.trim(), developmentGoal: data.developmentGoal.trim(), personKey, status: 'active', createdAt: now, updatedAt: now }])
    rememberBooking(token)
    return token
  }

  await runTransaction(db!, async (transaction) => {
    const slotRef = doc(db!, 'slotClaims', slotId)
    const identityRef = doc(db!, 'bookingIdentities', personKey)
    const [slotSnap, identitySnap] = await Promise.all([transaction.get(slotRef), transaction.get(identityRef)])
    if (slotSnap.exists()) throw new Error('Этот слот уже занят')
    if (identitySnap.exists()) throw new Error('У вас уже есть запись')
    transaction.set(slotRef, { personKey, bookedBy: data.fullName.trim(), createdAt: serverTimestamp() })
    transaction.set(identityRef, { token, slotId, createdAt: serverTimestamp() })
    transaction.set(doc(db!, 'bookings', token), {
      token,
      slotId,
      fullName: data.fullName.trim(),
      team: data.team.trim(),
      developmentGoal: data.developmentGoal.trim(),
      personKey,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }).catch((error: unknown) => {
    if (error instanceof Error && (error.message.includes('занят') || error.message.includes('запись'))) throw error
    if (typeof error === 'object' && error && 'code' in error && error.code === 'permission-denied') throw new Error('Firebase отклонил запись: возможно, у вас уже есть активный слот или правила ещё не обновлены')
    throw error
  })
  rememberBooking(token)
  return token
}

export async function getBooking(token: string): Promise<Booking | null> {
  if (!firebaseEnabled || !db) return demoBookings().find((booking) => booking.token === token) || null
  const snapshot = await getDoc(doc(db, 'bookings', token))
  if (!snapshot.exists()) return null
  return { token: snapshot.id, ...snapshot.data(), status: snapshot.data().status || 'active' } as Booking
}

export async function cancelBooking(token: string) {
  const booking = await getBooking(token)
  if (!booking) throw new Error('Запись не найдена')
  if (!isActiveBooking(booking)) throw new Error('Эта запись уже отменена')
  if (!firebaseEnabled || !db) {
    const now = new Date().toISOString()
    writeDemo(demoBookings().map((item) => item.token === token ? { ...item, status: 'cancelled', cancelledAt: now, updatedAt: now } : item))
    if (myBookingToken() === token) forgetBooking()
    return
  }
  await runTransaction(db!, async (transaction) => {
    const claimIds = [...new Set([booking.slotId, normalizeSlotId(booking.slotId)])]
    const claimRefs = claimIds.map((slotId) => doc(db!, 'slotClaims', slotId))
    const claimSnaps = await Promise.all(claimRefs.map((claimRef) => transaction.get(claimRef)))
    claimSnaps.forEach((claimSnap, index) => {
      if (claimSnap.exists() && claimSnap.data().personKey === booking.personKey) transaction.delete(claimRefs[index])
    })
    transaction.delete(doc(db!, 'bookingIdentities', booking.personKey))
    transaction.update(doc(db!, 'bookings', token), { status: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() })
  })
  if (myBookingToken() === token) forgetBooking()
}

export async function moveBooking(token: string, nextSlotId: string) {
  nextSlotId = normalizeSlotId(nextSlotId)
  const booking = await getBooking(token)
  if (!booking) throw new Error('Запись не найдена')
  if (!isActiveBooking(booking)) throw new Error('Эта запись уже отменена')
  if (!firebaseEnabled || !db) {
    const bookings = demoBookings()
    if (bookings.some((item) => isActiveBooking(item) && normalizeSlotId(item.slotId) === nextSlotId)) throw new Error('Этот слот уже занят')
    writeDemo(bookings.map((item) => item.token === token ? { ...item, slotId: nextSlotId, updatedAt: new Date().toISOString() } : item))
    return
  }
  await runTransaction(db!, async (transaction) => {
    const nextRef = doc(db!, 'slotClaims', nextSlotId)
    const previousIds = [...new Set([booking.slotId, normalizeSlotId(booking.slotId)])].filter((slotId) => slotId !== nextSlotId)
    const previousRefs = previousIds.map((slotId) => doc(db!, 'slotClaims', slotId))
    const [nextSnap, ...previousSnaps] = await Promise.all([transaction.get(nextRef), ...previousRefs.map((ref) => transaction.get(ref))])
    if (nextSnap.exists()) throw new Error('Этот слот уже занят')
    previousSnaps.forEach((previousSnap, index) => {
      if (previousSnap.exists() && previousSnap.data().personKey === booking.personKey) transaction.delete(previousRefs[index])
    })
    transaction.set(nextRef, { personKey: booking.personKey, bookedBy: booking.fullName, createdAt: serverTimestamp() })
    transaction.set(doc(db!, 'bookingIdentities', booking.personKey), { token, slotId: nextSlotId, createdAt: serverTimestamp() })
    transaction.update(doc(db!, 'bookings', token), { slotId: nextSlotId, status: 'active', updatedAt: serverTimestamp() })
  })
}

export async function updateBooking(token: string, values: Partial<Pick<Booking, 'fullName' | 'team' | 'developmentGoal'>>) {
  if (!firebaseEnabled || !db) {
    writeDemo(demoBookings().map((item) => item.token === token ? { ...item, ...values, updatedAt: new Date().toISOString() } : item))
    return
  }
  if (values.fullName) {
    const booking = await getBooking(token)
    if (!booking) throw new Error('Запись не найдена')
    await runTransaction(db!, async (transaction) => {
      transaction.update(doc(db!, 'bookings', token), { ...values, updatedAt: serverTimestamp() })
      if (isActiveBooking(booking)) transaction.set(doc(db!, 'slotClaims', normalizeSlotId(booking.slotId)), { personKey: booking.personKey, bookedBy: values.fullName?.trim(), createdAt: serverTimestamp() }, { merge: true })
    })
    return
  }
  await updateDoc(doc(db, 'bookings', token), { ...values, updatedAt: serverTimestamp() })
}

export async function listBookings(): Promise<Booking[]> {
  if (!firebaseEnabled || !db) return demoBookings()
  const [snapshot, notesSnapshot] = await Promise.all([getDocs(collection(db, 'bookings')), getDocs(collection(db, 'adminNotes'))])
  const notes = new Map(notesSnapshot.docs.map((item) => [item.id, item.data() as AdminNotes]))
  return snapshot.docs.map((item) => ({ token: item.id, ...item.data(), status: item.data().status || 'active', notes: notes.get(item.id) } as Booking))
}

export async function getSyncDiagnostics(): Promise<SyncDiagnostics> {
  if (!firebaseEnabled || !db) {
    const bookings = demoBookings()
    const active = bookings.filter(isActiveBooking)
    return { bookingCount: bookings.length, activeBookingCount: active.length, cancelledBookingCount: bookings.length - active.length, claimCount: active.length, identityCount: active.length, missingClaimTokens: [], missingIdentityTokens: [], orphanClaimIds: [], orphanIdentityIds: [], conflictSlotIds: [], conflictPersonKeys: [], legacyClaimIds: [], legacyBookingTokens: [] }
  }
  const [bookingSnap, claimSnap, identitySnap] = await Promise.all([
    getDocs(collection(db, 'bookings')),
    getDocs(collection(db, 'slotClaims')),
    getDocs(collection(db, 'bookingIdentities')),
  ])
  const bookings = bookingSnap.docs.map((item) => ({ token: item.id, ...item.data(), status: item.data().status || 'active' } as Booking))
  const active = bookings.filter(isActiveBooking)
  const claims = new Map<string, ClaimRecord>(claimSnap.docs.map((item) => [normalizeSlotId(item.id), {
    rawId: item.id,
    personKey: item.data().personKey as string | undefined,
    bookedBy: item.data().bookedBy as string | undefined,
  }]))
  const identities = new Map<string, IdentityRecord>(identitySnap.docs.map((item) => [item.id, {
    token: item.data().token as string | undefined,
    slotId: item.data().slotId as string | undefined,
  }]))
  const bookingsBySlot = new Map<string, Booking[]>()
  const bookingsByPerson = new Map<string, Booking[]>()
  for (const booking of active) {
    const canonicalSlotId = normalizeSlotId(booking.slotId)
    bookingsBySlot.set(canonicalSlotId, [...(bookingsBySlot.get(canonicalSlotId) || []), booking])
    bookingsByPerson.set(booking.personKey, [...(bookingsByPerson.get(booking.personKey) || []), booking])
  }
  const duplicateSlotIds = [...bookingsBySlot].filter(([, items]) => items.length > 1).map(([slotId]) => slotId)
  const duplicatePersonKeys = [...bookingsByPerson].filter(([, items]) => items.length > 1).map(([personKey]) => personKey)
  const diagnostics = {
    bookingCount: bookings.length,
    activeBookingCount: active.length,
    cancelledBookingCount: bookings.length - active.length,
    claimCount: claimSnap.size,
    identityCount: identitySnap.size,
    missingClaimTokens: active.filter((booking) => !claims.has(normalizeSlotId(booking.slotId))).map((booking) => booking.token),
    missingIdentityTokens: active.filter((booking) => {
      const identity = identities.get(booking.personKey)
      return !identity || identity.token !== booking.token || normalizeSlotId(identity.slotId || '') !== normalizeSlotId(booking.slotId)
    }).map((booking) => booking.token),
    orphanClaimIds: claimSnap.docs.filter((item) => !active.some((booking) => normalizeSlotId(booking.slotId) === normalizeSlotId(item.id) && booking.personKey === item.data().personKey)).map((item) => item.id),
    orphanIdentityIds: identitySnap.docs.filter((item) => !active.some((booking) => booking.personKey === item.id && booking.token === item.data().token)).map((item) => item.id),
    conflictSlotIds: [...new Set([
      ...duplicateSlotIds,
      ...active.filter((booking) => { const claim = claims.get(normalizeSlotId(booking.slotId)); return Boolean(claim && claim.personKey !== booking.personKey) }).map((booking) => normalizeSlotId(booking.slotId)),
    ])],
    conflictPersonKeys: duplicatePersonKeys,
    legacyClaimIds: claimSnap.docs.filter((item) => normalizeSlotId(item.id) !== item.id).map((item) => item.id),
    legacyBookingTokens: active.filter((booking) => normalizeSlotId(booking.slotId) !== booking.slotId).map((booking) => booking.token),
  }
  console.info('[booking-sync] Диагностика', diagnostics)
  return diagnostics
}

export async function repairBookingIndexes() {
  if (!firebaseEnabled || !db) return getSyncDiagnostics()
  const [bookingSnap, claimSnap, identitySnap] = await Promise.all([getDocs(collection(db, 'bookings')), getDocs(collection(db, 'slotClaims')), getDocs(collection(db, 'bookingIdentities'))])
  const active = bookingSnap.docs.map((item) => ({ token: item.id, ...item.data(), status: item.data().status || 'active' } as Booking)).filter(isActiveBooking)
  const slotCounts = new Map<string, number>()
  const personCounts = new Map<string, number>()
  for (const booking of active) {
    const canonicalSlotId = normalizeSlotId(booking.slotId)
    slotCounts.set(canonicalSlotId, (slotCounts.get(canonicalSlotId) || 0) + 1)
    personCounts.set(booking.personKey, (personCounts.get(booking.personKey) || 0) + 1)
  }
  const batch = writeBatch(db!)
  for (const booking of active) {
    const canonicalSlotId = normalizeSlotId(booking.slotId)
    if (slotCounts.get(canonicalSlotId) === 1) {
      batch.set(doc(db!, 'slotClaims', canonicalSlotId), { personKey: booking.personKey, bookedBy: booking.fullName, createdAt: serverTimestamp() }, { merge: true })
    }
    if (booking.slotId !== canonicalSlotId) batch.update(doc(db!, 'bookings', booking.token), { slotId: canonicalSlotId, updatedAt: serverTimestamp() })
    if (personCounts.get(booking.personKey) === 1) batch.set(doc(db!, 'bookingIdentities', booking.personKey), { token: booking.token, slotId: canonicalSlotId, createdAt: serverTimestamp() }, { merge: true })
  }
  for (const claimDoc of claimSnap.docs) {
    const canonicalSlotId = normalizeSlotId(claimDoc.id)
    const activeCount = slotCounts.get(canonicalSlotId) || 0
    if (activeCount < 2 && (activeCount === 0 || claimDoc.id !== canonicalSlotId)) batch.delete(doc(db!, 'slotClaims', claimDoc.id))
  }
  for (const identityDoc of identitySnap.docs) {
    if ((personCounts.get(identityDoc.id) || 0) === 0) batch.delete(doc(db!, 'bookingIdentities', identityDoc.id))
  }
  await batch.commit()
  console.info(`[booking-sync] Восстановлены индексы для активных bookings: ${active.length}`)
  return getSyncDiagnostics()
}

export async function saveAdminNotes(token: string, notes: AdminNotes) {
  if (!firebaseEnabled || !db) {
    writeDemo(demoBookings().map((item) => item.token === token ? { ...item, notes } : item))
    return
  }
  await setDoc(doc(db, 'adminNotes', token), notes)
}

// История bookings не удаляется: администратор отменяет запись мягко.
export async function adminDeleteBooking(token: string) {
  await cancelBooking(token)
}
