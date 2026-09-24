/**
 * Per-page title, description, canonical URL and link-preview tags.
 * React 19 hoists these into <head> in the browser; at build time
 * scripts/prerender.mjs moves them there, so crawlers that run no
 * JavaScript still see each page's own.
 *
 * The canonical always names monthlyrule.com, so the retired domain that
 * still serves the same pages does not compete with it in search.
 */
const ORIGIN = 'https://monthlyrule.com'

type Props = {
  /** Omit on the home page, which is titled with the brand alone. */
  title?: string
  description: string
  path: string
  /** For pages that should never be indexed, such as "not found". */
  noindex?: boolean
}

export default function PageMeta({ title, description, path, noindex }: Props) {
  const fullTitle = title ? `${title} — Monthly Rule` : 'Monthly Rule'
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={ORIGIN + path} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={ORIGIN + path} />
      {noindex && <meta name="robots" content="noindex" />}
    </>
  )
}
