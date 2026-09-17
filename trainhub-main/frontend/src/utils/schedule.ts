import type { AvailabilitySlot } from '../api/types'

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function overlapsAny(start: Date, end: Date, busySlots: AvailabilitySlot[]): boolean {
  return busySlots.some((b) => overlaps(start, end, new Date(b.start_datetime), new Date(b.end_datetime)))
}
