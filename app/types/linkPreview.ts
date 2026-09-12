export type LinkPreview = {
  url: string
  title: string | null
  description: string | null
  image: string | null
  site_name: string | null
}

export function isLinkPreview(value: unknown): value is LinkPreview {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.url === 'string' && v.url.trim().length > 0
}

export function normalizeLinkPreview(value: unknown): LinkPreview | null {
  if (!isLinkPreview(value)) return null
  return {
    url: value.url.trim(),
    title: typeof value.title === 'string' ? value.title : null,
    description: typeof value.description === 'string' ? value.description : null,
    image: typeof value.image === 'string' ? value.image : null,
    site_name: typeof value.site_name === 'string' ? value.site_name : null,
  }
}

/** True when the pasted/dropped text is a single http(s) URL (not YouTube/Vimeo — caller checks embed). */
export function isStandaloneHttpUrl(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
