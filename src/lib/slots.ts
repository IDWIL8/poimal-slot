import { differenceInCalendarDays, getDay, parseISO } from 'date-fns'
import type { Slot } from '../types'

const times = ['14:00–15:00', '15:00–16:00', '16:00–17:00']
const days = [
  { name: 'Понедельник', slug: 'mon' },
  { name: 'Вторник', slug: 'tue' },
  { name: 'Среда', slug: 'wed' },
]

// Используется только для однократного чтения старых ID формата YYYY-MM-DD_HH.
// Новые слоты и интерфейс полностью независимы от календарных дат.
const LEGACY_START = parseISO('2026-07-06')

export function normalizeSlotId(slotId: string) {
  if (/^(planning|review)_(mon|tue|wed)_(14|15|16)$/.test(slotId)) return slotId
  const legacy = /^(\d{4}-\d{2}-\d{2})_(14|15|16)$/.exec(slotId)
  if (!legacy) return slotId
  const date = parseISO(legacy[1])
  const daySlug = ({ 1: 'mon', 2: 'tue', 3: 'wed' } as Record<number, string>)[getDay(date)]
  if (!daySlug) return slotId
  const week = differenceInCalendarDays(date, LEGACY_START) < 7 ? 'planning' : 'review'
  return `${week}_${daySlug}_${legacy[2]}`
}

export const createSlots = (): Slot[] => ([1, 2] as const).flatMap((week) =>
  days.flatMap((day) => times.map((time, timeIndex) => ({
    id: `${week === 1 ? 'planning' : 'review'}_${day.slug}_${timeIndex + 14}`,
    week,
    dayKey: `${week}_${day.slug}`,
    dayName: day.name,
    time,
    status: 'available' as const,
  }))),
)

export const slotById = (slotId: string) => createSlots().find((slot) => slot.id === normalizeSlotId(slotId))
export const TOTAL_SLOTS = 18
