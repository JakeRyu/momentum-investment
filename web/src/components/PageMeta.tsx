/**
 * Per-page title, description and canonical URL. React 19 hoists these
 * into <head> wherever they are rendered.
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
  return (
    <>
      <title>{title ? `${title} — Monthly Rule` : 'Monthly Rule'}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={ORIGIN + path} />
      {noindex && <meta name="robots" content="noindex" />}
    </>
  )
}
