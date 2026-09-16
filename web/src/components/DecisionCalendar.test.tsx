import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DecisionCalendar from './DecisionCalendar'

describe('DecisionCalendar', () => {
  it('asks for exactly one day of the month', () => {
    const { container } = render(<DecisionCalendar />)
    expect(container.querySelectorAll('.calendar__day--act')).toHaveLength(1)
    expect(
      container.querySelector('.calendar__tally-figure')?.textContent,
    ).toMatch(/1\s*of\s*31/)
  })

  it('puts the close and the day you act on business days, not weekends', () => {
    const { container } = render(<DecisionCalendar />)
    // Weekends are greyed so that "last business day" reads without
    // explanation — which only works if no mark lands on one.
    for (const marked of container.querySelectorAll(
      '.calendar__day--act, .calendar__day--close, .calendar__day--next',
    )) {
      expect(marked.className).not.toMatch(/calendar__day--weekend/)
    }
  })

  it('shows the next decision already set, outside this month', () => {
    const { container } = render(<DecisionCalendar />)
    const next = container.querySelector('.calendar__day--next')
    expect(next).not.toBeNull()
    expect(next?.className).toMatch(/calendar__day--outside/)
  })

  it('lays the month out as whole weeks', () => {
    const { container } = render(<DecisionCalendar />)
    const days = container.querySelectorAll('.calendar__day')
    expect(days.length % 7).toBe(0)
  })
})
