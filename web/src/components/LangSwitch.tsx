import { Link } from 'react-router-dom'

import type { Lang } from '../lessons/courses'

/** Names the other language in that language, as language menus do. */
const LABEL: Record<Lang, string> = { en: 'English', ko: '한국어' }

type Props = {
  /** The language the link leads to. */
  lang: Lang
  to: string
}

export default function LangSwitch({ lang, to }: Props) {
  return (
    <p className="lang-switch">
      <Link to={to} hrefLang={lang} lang={lang}>
        {LABEL[lang]}
      </Link>
    </p>
  )
}
