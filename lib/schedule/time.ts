import type { Time, TimeBlock } from './types'

const TIME_PATTERN = /^(\d{2}):(\d{2})$/

export function parseTime(value: Time): number {
  const match = TIME_PATTERN.exec(value)
  if (!match) {
    throw new Error(`Invalid time: ${value}`)
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time: ${value}`)
  }

  return hours * 60 + minutes
}

export function blocksOverlap(left: TimeBlock, right: TimeBlock): boolean {
  if (left.day !== right.day) return false

  const leftStart = parseTime(left.start)
  const leftEnd = parseTime(left.end)
  const rightStart = parseTime(right.start)
  const rightEnd = parseTime(right.end)

  return leftStart < rightEnd && rightStart < leftEnd
}

/** Returns the non-overlapping gap in minutes, or null for another day/overlap. */
export function commuteGap(left: TimeBlock, right: TimeBlock): number | null {
  if (left.day !== right.day || blocksOverlap(left, right)) return null

  const leftStart = parseTime(left.start)
  const leftEnd = parseTime(left.end)
  const rightStart = parseTime(right.start)
  const rightEnd = parseTime(right.end)

  if (leftEnd <= rightStart) return rightStart - leftEnd
  return leftStart - rightEnd
}

export function formatTimeSpanish(value: Time): string {
  const minutes = parseTime(value)
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour < 12 ? 'a. m.' : 'p. m.'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}
