import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

import AppRoutes from './AppRoutes'

/** Renders one route to HTML at build time; see scripts/prerender.mjs. */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  )
}
