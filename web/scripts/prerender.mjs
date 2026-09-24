// Writes a static HTML file for every page in public/sitemap.xml, plus
// 404.html, so crawlers and link previews that run no JavaScript still
// see each page's content and its own title and description.
//
// Runs after `vite build` (client, into dist/) and
// `vite build --ssr` (into dist-ssr/).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { render } from '../dist-ssr/entry-server.js'

const TITLE = '<title>Monthly Rule</title>'
const ROOT = '<div id="root"></div>'
const HTML = '<html lang="en">'

const template = readFileSync('dist/index.html', 'utf8')
for (const marker of [TITLE, ROOT, HTML]) {
  if (template.split(marker).length !== 2) {
    throw new Error(`dist/index.html must contain ${marker} exactly once`)
  }
}

const paths = [
  ...readFileSync('public/sitemap.xml', 'utf8').matchAll(
    /<loc>https:\/\/monthlyrule\.com(\/[^<]*)<\/loc>/g,
  ),
].map((m) => m[1])

// React emits the hoisted <title>, <meta> and <link> from PageMeta ahead
// of the markup; they belong in <head>.
const HEAD = /^(?:<title>[^<]*<\/title>|<meta [^>]*\/>|<link [^>]*\/>)+/

function page(url) {
  const html = render(url)
  const head = html.match(HEAD)?.[0]
  if (!head) throw new Error(`${url} rendered no PageMeta`)
  const lang = url.startsWith('/ko/') ? 'ko' : 'en'
  return template
    .replace(HTML, `<html lang="${lang}">`)
    .replace(TITLE, head)
    .replace(ROOT, `<div id="root">${html.slice(head.length)}</div>`)
}

function write(file, html) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

for (const url of paths) {
  write(url === '/' ? 'dist/index.html' : `dist${url}/index.html`, page(url))
}
write('dist/404.html', page('/404'))

console.log(`prerendered ${paths.length} pages and 404.html`)
