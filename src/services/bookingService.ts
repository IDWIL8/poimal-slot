import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db, firebaseEnabled } from '../lib/firebase'
import { createSlots } from '../lib/slots'
import { personFingerprint, secureToken } from '../lib/utils'
import type { AdminNotes, Booking, BookingFormData } from '../types'

const DEMO_KEY = 'coach-demo-bookings-v2'
const MY_TOKEN_KEY = 'coach-my-booking-token'
const CHANGE_EVENT = 'coach-bookings-change'

const seed: Booking[] = [
  { token: 'demo-anna', slotId: '', fullName: 'Анна', team: 'Product', developmentGoal: 'Приоритизация', personKey: 'seed-anna', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-timur', slotId: '', fullName: 'Тимур', team: 'Design', developmentGoal: 'Leadership', personKey: 'seed-timur', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-lera', slotId: '', fullName: 'Лера', team: 'Growth', developmentGoal: 'Stakeholder management', personKey: 'seed-lera', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-maks', slotId: '', fullName: 'Максим', team: 'Platform', developmentGoal: 'Делегирование', personKey: 'seed-maks', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { token: 'demo-sasha', slotId: '', fullName: 'Саша', team: 'Core', developmentGoal: 'Product strategy', personKey: 'seed-sasha', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

function demoBookings(): Booking[] {
  const saved = localStorage.getItem(DEMO_KEY)
  if (saved) return JSON.parse(saved) as Booking[]
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
    const notify = () => callback(demoBookings().map((booking) => ({ slotId: booking.slotId, token: booking.token, bookedBy: booking.fullName })))
    notify()
    window.addEventListener(CHANGE_EVENT, notify)
    window.addEventListener('storage', notify)
    return () => { window.removeEventListener(CHANGE_EVENT, notify); window.removeEventListener('storage', notify) }
  }
  return onSnapshot(collection(db, 'slotClaims'), (snapshot) => {
    callback(snapshot.docs.map((item) => ({ slotId: item.id, bookedBy: item.data().bookedBy as string | undefined })))
  })
}

export async function createBooking(slotId: string, data: BookingFormData) {
  const personKey = await personFingerprint(data.fullName, data.team)
  const token = secureToken()
  if (!firebaseEnabled || !db) {
    const bookings = demoBookings()
    if (bookings.some((booking) => booking.slotId === slotId)) throw new Error('Этот слот уже занят')
    if (bookings.some((booking) => booking.personKey === personKey)) throw new Error('У вас уже есть запись')
    const now = new Date().toISOString()
    writeDemo([...bookings, { token, slotId, fullName: data.fullName.trim(), team: data.team.trim(), developmentGoal: data.developmentGoal.trim(), personKey, createdAt: now, updatedAt: now }])
    rememberBooking(token)
    return token
  }

  await runTransaction(db!, async (transaction) => {
    const slotRef = doc(db!, 'slotClaims', slotId)
    const identityRef = doc(db!, 'bookingIdentities', personKey)
    const slotSnap = await transaction.get(slotRef)
    if (slotSnap.exists()) throw new Error('Этот слот уже занят')
    // The identity document is intentionally not read by public clients. Its
    // create-only security rule makes the transaction fail if it already exists.
    transaction.set(slotRef, { personKey, bookedBy: data.fullName.trim(), createdAt: serverTimestamp() })
    transaction.set(identityRef, { token, slotId, createdAt: serverTimestamp() })
    transaction.set(doc(db!, 'bookings', token), {
      token, slotId, fullName: data.fullName.trim(), team: data.team.trim(),
      developmentGoal: data.developmentGoal.trim(), personKey,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message.includes('already')) throw error
    if (typeof error === 'object' && error && 'code' in error && error.code === 'permission-denied') throw new Error('Firebase отклонил запись: возможно, слот уже забронирован или правила ещё не обновились')
    throw error
  })
  rememberBooking(token)
  return token
}

export async function getBooking(token: string): Promise<Booking | null> {
  if (!firebaseEnabled || !db) return demoBookings().find((booking) => booking.token === token) || null
  const snapshot = await getDoc(doc(db!, 'bookings', token))
  if (!snapshot.exists()) return null
  return { token: snapshot.id, ...snapshot.data() } as Booking
}

export async function cancelBooking(token: string) {
  const booking = await getBooking(token)
  if (!booking) throw new Error('Запись не найдена')
  if (!firebaseEnabled || !db) {
    writeDemo(demoBookings().filter((item) => item.token !== token))
    if (myBookingToken() === token) forgetBooking()
    return
  }
  await runTransaction(db!, async (transaction) => {
    transaction.delete(doc(db!, 'bookings', token))
    transaction.delete(doc(db!, 'slotClaims', booking.slotId))
    transaction.delete(doc(db!, 'bookingIdentities', booking.personKey))
  })
  if (myBookingToken() === token) forgetBooking()
}

export async function moveBooking(token: string, nextSlotId: string) {
  const booking = await getBooking(token)
  if (!booking) throw new Error('Запись не найдена')
  if (!firebaseEnabled || !db) {
    const bookings = demoBookings()
    if (bookings.some((item) => item.slotId === nextSlotId)) throw new Error('Этот слот уже занят')
    writeDemo(bookings.map((item) => item.token === token ? { ...item, slotId: nextSlotId, updatedAt: new Date().toISOString() } : item))
    return
  }
  await runTransaction(db!, async (transaction) => {
    const nextRef = doc(db!, 'slotClaims', nextSlotId)
    if ((await transaction.get(nextRef)).exists()) throw new Error('Этот слот уже занят')
    transaction.delete(doc(db!, 'slotClaims', booking.slotId))
    transaction.set(nextRef, { personKey: booking.personKey, bookedBy: booking.fullName, createdAt: serverTimestamp() })
    transaction.update(doc(db!, 'bookingIdentities', booking.personKey), { slotId: nextSlotId })
    transaction.update(doc(db!, 'bookings', token), { slotId: nextSlotId, updatedAt: serverTimestamp() })
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
      transaction.update(doc(db!, 'slotClaims', booking.slotId), { bookedBy: values.fullName?.trim() })
    })
    return
  }
  await updateDoc(doc(db!, 'bookings', token), { ...values, updatedAt: serverTimestamp() })
}

export async function listBookings(): Promise<Booking[]> {
  if (!firebaseEnabled || !db) return demoBookings()
  const [snapshot, notesSnapshot] = await Promise.all([getDocs(collection(db!, 'bookings')), getDocs(collection(db!, 'adminNotes'))])
  const notes = new Map(notesSnapshot.docs.map((item) => [item.id, item.data() as AdminNotes]))
  return snapshot.docs.map((item) => ({ token: item.id, ...item.data(), notes: notes.get(item.id) } as Booking))
}

export async function saveAdminNotes(token: string, notes: AdminNotes) {
  if (!firebaseEnabled || !db) {
    writeDemo(demoBookings().map((item) => item.token === token ? { ...item, notes } : item))
    return
  }
  await setDoc(doc(db!, 'adminNotes', token), notes)
}

export async function adminDeleteBooking(token: string) {
  await cancelBooking(token)
  if (firebaseEnabled && db) await deleteDoc(doc(db!, 'adminNotes', token))
}
