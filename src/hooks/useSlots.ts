import { useEffect, useMemo, useState } from 'react'
import { createSlots } from '../lib/slots'
import { getBooking, myBookingToken, subscribeToClaims } from '../services/bookingService'

export function useSlots() {
  const [claims, setClaims] = useState<Array<{ slotId: string; token?: string; bookedBy?: string }>>([])
  const [mineSlotId, setMineSlotId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeToClaims((items) => { setClaims(items); setLoading(false) }), [])
  useEffect(() => {
    const token = myBookingToken()
    if (token) getBooking(token).then((booking) => setMineSlotId(booking?.slotId || null))
  }, [claims])

  const slots = useMemo(() => {
    const mine = myBookingToken()
    return createSlots().map((slot, index) => {
      const claim = claims.find((item) => item.slotId === slot.id || item.slotId === String(index))
      return { ...slot, bookedBy: claim?.bookedBy, status: claim ? (claim.token === mine || slot.id === mineSlotId ? 'mine' as const : 'booked' as const) : 'available' as const }
    })
  }, [claims, mineSlotId])

  return { slots, loading }
}
