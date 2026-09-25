import type { Lesson } from './index'
import { LESSONS } from './index'
import { LESSONS_KO } from './ko'

export type Lang = 'en' | 'ko'

/** Which catalog a language reads, and where its pages live. */
export const COURSES: Record<Lang, { lessons: readonly Lesson[]; prefix: '' | '/ko' }> = {
  en: { lessons: LESSONS, prefix: '' },
  ko: { lessons: LESSONS_KO, prefix: '/ko' },
}

export function findCourseLesson(lang: Lang, slug: string): Lesson | undefined {
  return COURSES[lang].lessons.find((l) => l.slug === slug)
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'ko' : 'en'
}
