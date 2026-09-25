import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import AppPromo from './components/AppPromo'
import { LESSONS } from './lessons'
import { LESSONS_KO } from './lessons/ko'
import KoreanHead from './components/KoreanHead'
import { STRATEGIES, drawdownRange } from './strategies'
import About from './routes/About'
import Learn from './routes/Learn'
import Lesson from './routes/Lesson'
import Home from './routes/Home'
import NotFound from './routes/NotFound'
import Privacy from './routes/Privacy'
import StrategyPage from './routes/StrategyPage'

/** Mirrors main.tsx. The app links to these paths; none may move. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/strategies/:id" element={<StrategyPage />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:slug" element={<Lesson />} />
        <Route path="/ko/learn" element={<Learn lang="ko" />} />
        <Route path="/ko/learn/:slug" element={<Lesson lang="ko" />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('URLs the iPhone app links to', () => {
  // HomeScreen.tsx:91 — "How these strategies work →"
  it('serves the landing page', () => {
    const { container } = renderAt('/')
    expect(container.querySelector('.not-found')).toBeNull()
  })

  // DecisionScreen.tsx:241 — "How this strategy works →"
  it.each(STRATEGIES.map((s) => s.id))('serves /strategies/%s', (id) => {
    const { container } = renderAt(`/strategies/${id}`)
    expect(container.querySelector('.not-found')).toBeNull()
  })

  // App Store listing — privacy policy URL
  it('serves the privacy page', () => {
    const { container } = renderAt('/privacy')
    expect(container.querySelector('.not-found')).toBeNull()
  })
})

describe('AppPromo', () => {
  it('does not advertise the date picker phase 2 removed', () => {
    const { container } = render(<AppPromo />)
    expect(container.textContent).not.toMatch(/any date|date you choose|per-date/i)
  })

  it('describes what the app actually does', () => {
    render(<AppPromo />)
    expect(screen.getByText(/in force/i)).toBeInTheDocument()
  })
})

describe('About', () => {
  it('leaves the teaching to the course', () => {
    // Lesson 3 owns breadth and the canary universe. Two definitions of
    // one term on one site is what the course exists to stop.
    const { container } = renderAt('/about')
    expect(container.textContent).not.toMatch(/coal miners|early-warning basket/i)
    expect(container.textContent).not.toMatch(
      /instead of only ranking assets by their\s+momentum scores/i,
    )
  })

  it('points a reader who wants the concepts at the course', () => {
    renderAt('/about')
    expect(screen.getByRole('link', { name: /course/i })).toHaveAttribute(
      'href',
      '/learn',
    )
  })

  it('does not compete with the label the app links to', () => {
    // HomeScreen.tsx's link reads "How these strategies work →" and goes
    // to /. An About heading with the same words sends a reader who
    // followed it to the wrong page.
    const { container } = renderAt('/about')
    expect(container.textContent).not.toMatch(/How the strategies work/i)
  })

  it('keeps what only About can say', () => {
    const { container } = renderAt('/about')
    expect(container.textContent).toMatch(/Wouter Keller/)
    expect(container.textContent).toMatch(/not investment advice/)
    expect(container.querySelectorAll('.paper-list li')).toHaveLength(
      STRATEGIES.length,
    )
  })
})

describe('the course', () => {
  it('lists every lesson on /learn', () => {
    renderAt('/learn')
    for (const l of LESSONS) {
      expect(
        screen.getByRole('link', { name: new RegExp(l.title.replace(/[?]/g, '\\?')) }),
        l.slug,
      ).toHaveAttribute('href', `/learn/${l.slug}`)
    }
  })

  it.each(LESSONS.map((l) => l.slug))('serves /learn/%s', (slug) => {
    const { container } = renderAt(`/learn/${slug}`)
    expect(container.querySelector('.not-found')).toBeNull()
  })

  it('404s on a lesson that does not exist', () => {
    const { container } = renderAt('/learn/how-to-get-rich')
    expect(container.querySelector('.not-found')).not.toBeNull()
  })

  it('says where the reader is in the sequence', () => {
    const { container } = renderAt('/learn/what-breadth-adds')
    expect(container.textContent).toMatch(
      new RegExp(`Lesson 3 of ${LESSONS.length}`),
    )
  })

  it('does not hard-code how many lessons there are', () => {
    const { container: learn } = renderAt('/learn')
    expect(learn.textContent).not.toMatch(
      /\b(one|two|three|four|five|six|seven|eight)\s+(short\s+)?lessons\b/i,
    )

    const { container: home } = renderAt('/')
    expect(home.textContent).not.toMatch(
      /\b(one|two|three|four|five|six|seven|eight)\s+(short\s+)?lessons\b/i,
    )
  })

  it('states the lesson count from the catalog', () => {
    renderAt('/learn')
    expect(screen.getByText(`${LESSONS.length} lessons`)).toBeInTheDocument()
  })

  it('tells the reader what SHY is', () => {
    const { container } = renderAt('/learn/what-you-would-buy')
    expect(container.textContent).toMatch(/SHY/)
    expect(container.textContent).toMatch(/1–3 year US Treasuries/)
  })

  it('names UCITS substitutes for UK readers', () => {
    const { container } = renderAt('/learn/what-you-would-buy')
    expect(container.textContent).toMatch(/UCITS/)
    // The app's curated default for SPY, so the lesson and the app name
    // the same fund.
    expect(container.textContent).toMatch(/VUAG\.L/)
  })

  it('sizes each canary basket from the data, not from memory', () => {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five']
    const { container } = renderAt('/learn/what-breadth-adds')
    const text = container.querySelector('.lesson__body')?.textContent ?? ''
    for (const s of STRATEGIES) {
      const u = s.defaultUniverse
      if (!('canary' in u)) continue
      const n = Array.isArray(u.canary) ? u.canary.length : 1
      expect(text, s.shortName).toMatch(new RegExp(`${words[n]}( assets?)? for ${s.shortName}`))
    }
  })

  it('says the canary figure is the simplest case, and how DAA differs', () => {
    // CanaryGate draws one faltering canary sending everything defensive.
    // DAA moves only half on one bad canary; the prose has to say so.
    const { container } = renderAt('/learn/what-breadth-adds')
    expect(container.textContent).toMatch(/DAA[^.]*half/)
  })

  it('does not say the site computes on live prices', () => {
    // The rule reads the month-end close; "live prices" invites a reader
    // to act on today's market.
    const { container } = renderAt('/learn/running-it')
    expect(container.textContent).not.toMatch(/live prices/i)
  })

  it('quotes the drawdown range from the data, not from memory', () => {
    const { container } = renderAt('/learn/why-drawdown')
    const { min, max } = drawdownRange()
    expect(container.textContent).toMatch(
      new RegExp(`${min.toFixed(1)}% to ${max.toFixed(1)}%`),
    )
  })

  it('states the cases where the drawdown claim did not hold', () => {
    const { container } = renderAt('/learn/why-drawdown')
    expect(container.textContent).toMatch(/25\.2%/)
    expect(container.textContent).toMatch(/AllocateSmartly/)
  })

  it('renders its figure through BacktestFigure, with the month-end caveat', () => {
    const { container } = renderAt('/learn/why-drawdown')
    expect(container.querySelector('.backtest')).not.toBeNull()
    expect(container.textContent).toMatch(/measured at month-end/)
  })

  it('shows the comparison inside lesson 7, not a second copy of it', () => {
    const { container } = renderAt('/learn/choosing-one')
    expect(container.querySelector('.compare')).not.toBeNull()
    for (const s of STRATEGIES) {
      expect(
        container.querySelector(`[data-testid="compare-row-${s.id}"]`),
        s.id,
      ).not.toBeNull()
    }
  })

  it('does not rank the six by return', () => {
    const { container } = renderAt('/learn/choosing-one')
    expect(container.textContent).not.toMatch(
      /best performing|highest return|top performer/i,
    )
  })

  it('hands the last lesson off to a strategy page', () => {
    renderAt('/learn/running-it')
    expect(screen.getByRole('link', { name: /VAA/i })).toHaveAttribute(
      'href',
      '/strategies/vaa',
    )
  })

  it('reaches eight lessons, matching the copy on /learn', () => {
    // The two pages state the count from LESSONS.length; this pins the
    // course as finished so a ninth lesson is a deliberate decision.
    expect(LESSONS).toHaveLength(8)
    const { container } = renderAt('/learn/running-it')
    expect(container.textContent).toMatch(/Lesson 8 of 8/)
  })

  it('makes no forward-looking claim in any lesson body', () => {
    for (const l of LESSONS) {
      const { container, unmount } = renderAt(`/learn/${l.slug}`)
      expect(container.textContent, l.slug).not.toMatch(
        /will (?:return|earn|beat|grow|rise)|guarantee|is expected to return/i,
      )
      unmount()
    }
  })
})

describe('Korean course', () => {
  it('serves the Korean contents page in Korean', () => {
    const { container } = renderAt('/ko/learn')
    expect(container.querySelector('.not-found')).toBeNull()
    expect(container.querySelector('article')).toHaveAttribute('lang', 'ko')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('동적자산배분 강의')
  })

  it('links the contents pages to each other', () => {
    renderAt('/learn')
    expect(screen.getByRole('link', { name: '한국어' })).toHaveAttribute('href', '/ko/learn')
    cleanup()
    renderAt('/ko/learn')
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/learn')
  })

  it('does not invent a Korean lesson that does not exist', () => {
    const { container } = renderAt('/ko/learn/what-is-a-stock')
    expect(container.querySelector('.not-found')).not.toBeNull()
  })

  it('offers no Korean link on an English lesson with no Korean twin', () => {
    const untranslated = LESSONS.find(
      (l) => !LESSONS_KO.some((k) => k.slug === l.slug),
    )
    if (!untranslated) return // every lesson is translated
    renderAt(`/learn/${untranslated.slug}`)
    expect(screen.queryByRole('link', { name: '한국어' })).toBeNull()
  })

  it.each(LESSONS_KO.map((l) => l.slug))('serves /ko/learn/%s in Korean', (slug) => {
    const { container } = renderAt(`/ko/learn/${slug}`)
    expect(container.querySelector('.not-found')).toBeNull()
    expect(container.querySelector('article')).toHaveAttribute('lang', 'ko')
    // Rail and pager stay inside the Korean course.
    for (const a of container.querySelectorAll('.lesson__rail a, .lesson__pager a[href*="/learn/"]')) {
      expect(a.getAttribute('href'), a.textContent ?? '').toMatch(/^\/ko\/learn\//)
    }
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', `/learn/${slug}`)
  })
})

describe('Korean lesson 5', () => {
  it('tells Korean readers they buy the named funds, with no UCITS detour', () => {
    const { container } = renderAt('/ko/learn/what-you-would-buy')
    expect(container.textContent).not.toMatch(/UCITS|ISA/)
    expect(container.textContent).toMatch(/해외주식 계좌/)
  })
})

describe('Korean lesson 7', () => {
  it('drops the UCITS count', () => {
    const { container } = renderAt('/ko/learn/choosing-one')
    expect(container.querySelector('.lesson__body')?.textContent).not.toMatch(/UCITS/)
  })
  it('keeps the past-results caveat beside the table it no longer carries', () => {
    const { container } = renderAt('/ko/learn/choosing-one')
    expect(container.textContent).toMatch(/과거\s+결과가 미래를 예측하지는 않습니다/)
  })
})

describe('Korean lesson 8', () => {
  it('opens the Korean window at 9am, when the UTC date the site sends turns over', () => {
    // DecisionTool dates its request with toISOString(), i.e. in UTC, and
    // KST is UTC+9 all year. Before 09:00 KST on the first business day
    // the site would still compute as of the previous day.
    const { container } = renderAt('/ko/learn/running-it')
    const box = [...container.querySelectorAll('.lesson__define')].find((p) =>
      p.textContent?.includes('한국 시간 기준'),
    )
    expect(box?.textContent).toMatch(/오전 9시/)
    expect(box?.textContent).not.toMatch(/새벽 5시 이후/)
  })

  it('sends the Korean reader to the English strategy page, without a UCITS detour', () => {
    const { container } = renderAt('/ko/learn/running-it')
    expect(container.querySelector('.lesson__body a[href="/strategies/vaa"]')).not.toBeNull()
    expect(container.querySelector('.lesson__body')?.textContent).not.toMatch(/UCITS/)
  })
})

describe('KoreanHead', () => {
  it('marks the document Korean while mounted and restores it after', () => {
    document.documentElement.lang = 'en'
    const { unmount } = render(<KoreanHead />)
    expect(document.documentElement.lang).toBe('ko')
    unmount()
    expect(document.documentElement.lang).toBe('en')
  })

  it('hands English pages back an English document after a Korean first landing', () => {
    // A prerendered /ko page arrives with lang="ko" already on <html>;
    // leaving it must not keep that for the English pages that follow.
    document.documentElement.lang = 'ko'
    const { unmount } = render(<KoreanHead />)
    unmount()
    expect(document.documentElement.lang).toBe('en')
  })
})
