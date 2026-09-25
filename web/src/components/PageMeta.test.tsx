import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PageMeta from './PageMeta'

function hreflangs(container: HTMLElement) {
  return [...document.querySelectorAll('link[rel="alternate"]'), ...container.querySelectorAll('link[rel="alternate"]')]
    .map((l) => `${l.getAttribute('hreflang')} ${l.getAttribute('href')}`)
}

describe('PageMeta', () => {
  it('links a paired page to both languages, English as default', () => {
    const { container } = render(
      <PageMeta
        title="Learn"
        description="d"
        path="/ko/learn"
        alternates={{ en: '/learn', ko: '/ko/learn' }}
      />,
    )
    expect(new Set(hreflangs(container))).toEqual(
      new Set([
        'en https://monthlyrule.com/learn',
        'ko https://monthlyrule.com/ko/learn',
        'x-default https://monthlyrule.com/learn',
      ]),
    )
  })

  it('adds no language links to a page with no twin', () => {
    const { container } = render(<PageMeta title="About" description="d" path="/about" />)
    expect(hreflangs(container)).toEqual([])
  })
})
