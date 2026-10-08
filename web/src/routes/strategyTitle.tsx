import type { Strategy } from '../strategies'

export function dottedShort(s: Strategy): string {
  return s.shortName.split('').join('.') + '.'
}

// Split long-name titles at the first space so "Vigilant Asset Allocation"
// renders across two display lines for the magazine-spread hero.
export function splitTitle(full: string): React.ReactNode {
  const i = full.indexOf(' ')
  if (i === -1) return full
  const head = full.slice(0, i)
  const tail = full.slice(i + 1)
  return (
    <>
      {head}
      <br />
      {tail}
    </>
  )
}
