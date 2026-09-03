import { useEffect } from 'react'

export const SITE_NAME = 'HMS'
export const SITE_URL = 'https://hmsap.com'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/logo_png.png`

interface PageSeo {
  title: string
  description: string
  path: string
  image?: string
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Updates the page's <title> and meta tags in place (find-existing-or-create,
// never duplicates) so each marketing route can carry its own SEO content
// without a head-management library. Mirrors the document.title pattern
// already used by PrintButton.tsx.
export function setPageSeo({ title, description, path, image = DEFAULT_OG_IMAGE }: PageSeo) {
  const url = `${SITE_URL}${path}`

  document.title = title
  upsertMeta('name', 'title', title)
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'twitter:title', title)
  upsertMeta('property', 'twitter:description', description)
  upsertMeta('property', 'twitter:url', url)
  upsertMeta('property', 'twitter:image', image)
  upsertCanonical(url)
}

export function usePageSeo(seo: PageSeo) {
  useEffect(() => {
    setPageSeo(seo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seo.title, seo.description, seo.path, seo.image])
}
