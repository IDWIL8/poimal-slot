import { addDays, format, nextMonday, parseISO, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Slot } from '../types'

const times = ['14:00–15:00', '15:00–16:00', '16:00–17:00']
const dayNames = ['Понедельник', 'Вторник', 'Среда']

function sprintStart() {
  const configured = import.meta.env.VITE_SPRINT_START
  if (configured && /^\d{4}-\d{2}-\d{2}$/.test(configured)) return parseISO(configured)
  return nextMonday(startOfDay(new Date()))
}

export const createSlots = (): Slot[] => {
  const start = sprintStart()
  return ([0, 1] as const).flatMap((weekIndex) =>
    [0, 1, 2].flatMap((dayIndex) => {
      const date = addDays(start, weekIndex * 7 + dayIndex)
      const dayKey = format(date, 'yyyy-MM-dd')
      return times.map((time, timeIndex) => ({
        id: `${dayKey}_${timeIndex + 14}`,
        week: (weekIndex + 1) as 1 | 2,
        dayKey,
        dayName: dayNames[dayIndex],
        dayShort: format(date, 'd MMM', { locale: ru }),
        date: format(date, 'd MMMM yyyy', { locale: ru }),
        time,
        status: 'available' as const,
      }))
    }),
  )
}

export const slotById = (slotId: string) => createSlots().find((slot) => slot.id === slotId)
export const TOTAL_SLOTS = 18
