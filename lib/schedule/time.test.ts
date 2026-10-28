import { describe, expect, it } from 'vitest'
import { blocksOverlap, commuteGap, parseTime } from './time'
import type { TimeBlock } from './types'

const block = (day: TimeBlock['day'], start: TimeBlock['start'], end: TimeBlock['end']): TimeBlock => ({ day, start, end })

describe('schedule time utilities', () => {
  it('does not overlap when one block ends exactly as the other starts', () => {
    expect(blocksOverlap(block('mon', '06:00', '14:00'), block('mon', '14:00', '16:00'))).toBe(false)
    expect(commuteGap(block('mon', '06:00', '14:00'), block('mon', '14:00', '16:00'))).toBe(0)
  })

  it('handles blocks that cross noon without special casing', () => {
    expect(parseTime('12:30')).toBe(750)
    expect(blocksOverlap(block('mon', '11:30', '13:30'), block('mon', '12:00', '14:00'))).toBe(true)
  })

  it('calculates the gap in either direction on the same day', () => {
    expect(commuteGap(block('mon', '06:00', '08:00'), block('mon', '09:00', '10:00'))).toBe(60)
    expect(commuteGap(block('mon', '09:00', '10:00'), block('mon', '06:00', '08:00'))).toBe(60)
    expect(commuteGap(block('mon', '09:00', '10:00'), block('tue', '09:00', '10:00'))).toBeNull()
  })
})
