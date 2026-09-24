import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { LESSONS } from './lessons'
import { LESSONS_KO } from './lessons/ko'
import { STRATEGIES } from './strategies'

// public/sitemap.xml is written by hand, so a new lesson or strategy
// would otherwise go missing from it without anyone noticing.
describe('sitemap', () => {
  const xml = readFileSync('public/sitemap.xml', 'utf8')
  const listed = [...xml.matchAll(/<loc>https:\/\/monthlyrule\.com(\/[^<]*)<\/loc>/g)].map((m) => m[1])

  it('lists every page and nothing else', () => {
    const expected = [
      '/',
      ...STRATEGIES.map((s) => `/strategies/${s.id}`),
      '/learn',
      ...LESSONS.map((l) => `/learn/${l.slug}`),
      '/ko/learn',
      ...LESSONS_KO.map((l) => `/ko/learn/${l.slug}`),
      '/about',
      '/privacy',
    ]
    expect([...listed].sort()).toEqual([...expected].sort())
  })
})
