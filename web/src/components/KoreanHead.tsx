import { useEffect } from 'react'

const FONT =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap'

/**
 * What a Korean page needs beyond its text. Noto Serif KR is Source Han
 * Serif, drawn as Source Serif's companion, so Latin and Hangul match;
 * React hoists the stylesheet into <head>, and the prerender keeps it
 * there. The build writes lang="ko" into a prerendered page's <html>;
 * this effect keeps it right when the reader arrives by a client-side link.
 */
export default function KoreanHead() {
  useEffect(() => {
    const html = document.documentElement
    html.lang = 'ko'
    return () => {
      // Every page outside /ko is English. Restoring whatever was there
      // before would keep "ko" when the reader landed on a Korean page.
      html.lang = 'en'
    }
  }, [])
  return <link rel="stylesheet" href={FONT} precedence="default" />
}
