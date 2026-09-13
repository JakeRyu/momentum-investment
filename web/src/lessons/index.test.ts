import { describe, expect, it } from 'vitest'

import { LESSONS, findLesson } from './index'

describe('lesson catalog', () => {
  it('numbers the lessons from one, without gaps', () => {
    expect(LESSONS.map((l) => l.number)).toEqual(
      LESSONS.map((_, i) => i + 1),
    )
  })

  it('resolves every slug', () => {
    for (const l of LESSONS) {
      expect(findLesson(l.slug)?.slug, l.slug).toBe(l.slug)
    }
  })

  it('returns nothing for an unknown slug', () => {
    expect(findLesson('what-is-a-stock')).toBeUndefined()
  })

  it('gives every lesson a title and a summary', () => {
    for (const l of LESSONS) {
      expect(l.title, l.slug).toBeTruthy()
      expect(l.summary, l.slug).toBeTruthy()
    }
  })

  it('uses slugs that read as words, not numbers', () => {
    // The number lives in the metadata; the URL should still mean
    // something if the order changes.
    for (const l of LESSONS) {
      expect(l.slug, l.slug).toMatch(/^[a-z][a-z-]+[a-z]$/)
    }
  })
})
