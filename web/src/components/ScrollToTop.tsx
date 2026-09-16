import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Puts a new page at its top.
 *
 * A single-page app keeps the scroll position across a route change, so
 * reading lesson 1 to the bottom and clicking lesson 2 swapped the prose
 * underneath an unmoved viewport — the reader landed mid-argument with
 * no signal that anything had begun.
 *
 * Back and forward are left alone. On those the reader is returning to
 * something they have already read, and the position they left is the
 * useful one; the browser restores it, and scrolling to the top here
 * would take it away.
 *
 * React Router ships `ScrollRestoration` for this, but only for data
 * routers. `main.tsx` uses `BrowserRouter`, and converting the app's
 * routing to gain one effect is a larger change than the effect.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
