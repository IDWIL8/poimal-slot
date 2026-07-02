export type SlotStatus = 'available' | 'booked' | 'mine'

export interface Slot {
  id: string
  week: 1 | 2
  dayKey: string
  dayName: string
  dayShort: string
  date: string
  time: string
  status: SlotStatus
  bookingToken?: string
  bookedBy?: string
}

export interface Booking {
  token: string
  slotId: string
  fullName: string
  team: string
  developmentGoal: string
  personKey: string
  createdAt: string
  updatedAt: string
  notes?: AdminNotes
}

export interface AdminNotes {
  completed: boolean
  discussionNotes: string
  actionItems: string
  homework: string
  followUp: string
  progressRating: number
  nextTopics: string
}

export interface BookingFormData {
  fullName: string
  team: string
  developmentGoal: string
  agreement: boolean
}
