import { useEffect, useMemo, useState } from 'react'
import { createSlots, normalizeSlotId } from '../lib/slots'
import { getBooking, myBookingToken, subscribeToClaims } from '../services/bookingService'

export function useSlots() {
  const [claims, setClaims] = useState<Array<{ slotId: string; token?: string; bookedBy?: string }>>([])
  const [mineSlotId, setMineSlotId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeToClaims((items) => { setClaims(items); setLoading(false) }), [])
  useEffect(() => {
    const token = myBookingToken()
    if (token) getBooking(token).then((booking) => setMineSlotId(booking ? normalizeSlotId(booking.slotId) : null))
  }, [claims])

  useEffect(() => {
    const known = new Set(createSlots().map((slot) => slot.id))
    const unmatched = claims.filter((claim) => !known.has(normalizeSlotId(claim.slotId))).map((claim) => claim.slotId)
    if (unmatched.length) console.warn('[booking-sync] slotClaims не попали в grid', unmatched)
  }, [claims])

  const slots = useMemo(() => {
    const mine = myBookingToken()
    return createSlots().map((slot, index) => {
      const claim = claims.find((item) => normalizeSlotId(item.slotId) === slot.id || item.slotId === String(index))
      return { ...slot, bookedBy: claim?.bookedBy, status: claim ? (claim.token === mine || slot.id === mineSlotId ? 'mine' as const : 'booked' as const) : 'available' as const }
    })
  }, [claims, mineSlotId])

  return { slots, loading }
}
