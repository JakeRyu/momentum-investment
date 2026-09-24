import { describe, expect, it } from 'vitest'

import { COURSES, findCourseLesson, otherLang } from './courses'
import { LESSONS } from './index'

describe('courses', () => {
  it('serves English with no prefix and Korean under /ko', () => {
    expect(COURSES.en.prefix).toBe('')
    expect(COURSES.ko.prefix).toBe('/ko')
    expect(COURSES.en.lessons).toBe(LESSONS)
  })

  it('finds a lesson only in its own language', () => {
    expect(findCourseLesson('en', LESSONS[0].slug)).toBe(LESSONS[0])
    expect(findCourseLesson('ko', 'what-is-a-stock')).toBeUndefined()
  })

  it('swaps languages', () => {
    expect(otherLang('en')).toBe('ko')
    expect(otherLang('ko')).toBe('en')
  })

  it('gives Korean lessons the slug and number of their English twin', () => {
    // A Korean lesson may lag behind its English one, never diverge from it.
    for (const ko of COURSES.ko.lessons) {
      const en = findCourseLesson('en', ko.slug)
      expect(en, ko.slug).toBeDefined()
      expect(ko.number, ko.slug).toBe(en!.number)
    }
  })
})
