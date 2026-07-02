import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

export function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => `${Math.round(latest)}${suffix}`)
  useEffect(() => { const control = animate(count, value, { duration: .8, ease: 'easeOut' }); return control.stop }, [count, value])
  return <motion.span>{rounded}</motion.span>
}
