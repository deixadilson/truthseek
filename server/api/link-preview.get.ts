import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { createError, defineEventHandler, getQuery } from 'h3'

export type LinkPreviewPayload = {
  url: string
  title: string | null
  description: string | null
  image: string | null
  site_name: string | null
}

const FETCH_TIMEOUT_MS = 5000
const MAX_HTML_BYTES = 1_500_000
const USER_AGENT =
  'Mozilla/5.0 (compatible; TruthSeekBot/1.0; +https://truthseek.network; link-preview)'

function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) {
    const parts = ip.split('.').map(Number)
    const [a, b] = parts
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast / reserved
    return false
  }
  if (version === 6) {
    const normalized = ip.toLowerCase()
    if (normalized === '::1') return true
    if (normalized === '::') return true
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // ULA
    if (normalized.startsWith('fe80')) return true // link-local
    if (normalized.startsWith('ff')) return true // multicast
    // IPv4-mapped
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice('::ffff:'.length)
      if (isIP(mapped) === 4) return isPrivateOrReservedIp(mapped)
    }
    return false
  }
  return true
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (
    host === 'localhost'
    || host.endsWith('.localhost')
    || host.endsWith('.local')
    || host.endsWith('.internal')
    || host === 'metadata.google.internal'
    || host === 'metadata'
  ) {
    return true
  }
  return false
}

async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'URL inválida.' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw createError({ statusCode: 400, statusMessage: 'Apenas URLs http(s) são permitidas.' })
  }

  if (parsed.username || parsed.password) {
    throw createError({ statusCode: 400, statusMessage: 'URL com credenciais não é permitida.' })
  }

  const hostname = parsed.hostname
  if (!hostname || isBlockedHostname(hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Host não permitido.' })
  }

  const ipLiteral = isIP(hostname)
  if (ipLiteral) {
    if (isPrivateOrReservedIp(hostname)) {
      throw createError({ statusCode: 400, statusMessage: 'Endereço de rede privada não é permitido.' })
    }
    return parsed
  }

  let addresses: string[]
  try {
    const result = await lookup(hostname, { all: true, verbatim: true })
    addresses = result.map((r) => r.address)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Não foi possível resolver o host.' })
  }

  if (!addresses.length || addresses.some(isPrivateOrReservedIp)) {
    throw createError({ statusCode: 400, statusMessage: 'Host resolve para endereço não permitido.' })
  }

  return parsed
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function getMetaContent(html: string, propertyOrName: string): string | null {
  const escaped = propertyOrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      'i',
    ),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      const value = decodeHtmlEntities(match[1].trim())
      if (value) return value
    }
  }
  return null
}

function getTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (!match?.[1]) return null
  const value = decodeHtmlEntities(match[1].trim())
  return value || null
}

function absoluteUrl(base: URL, maybeRelative: string | null): string | null {
  if (!maybeRelative) return null
  try {
    return new URL(maybeRelative, base).toString()
  } catch {
    return null
  }
}

function minimalPreview(url: string): LinkPreviewPayload {
  let hostname: string | null = null
  try {
    hostname = new URL(url).hostname
  } catch {
    hostname = null
  }
  return {
    url,
    title: hostname || url,
    description: null,
    image: null,
    site_name: hostname,
  }
}

function parseOg(html: string, pageUrl: URL): LinkPreviewPayload {
  const title =
    getMetaContent(html, 'og:title')
    || getMetaContent(html, 'twitter:title')
    || getTitleTag(html)
  const description =
    getMetaContent(html, 'og:description')
    || getMetaContent(html, 'twitter:description')
    || getMetaContent(html, 'description')
  const image = absoluteUrl(
    pageUrl,
    getMetaContent(html, 'og:image')
      || getMetaContent(html, 'og:image:url')
      || getMetaContent(html, 'twitter:image'),
  )
  const siteName = getMetaContent(html, 'og:site_name') || pageUrl.hostname

  return {
    url: pageUrl.toString(),
    title: title || siteName || pageUrl.hostname,
    description,
    image,
    site_name: siteName,
  }
}

async function fetchHtml(url: URL): Promise<{ html: string; finalUrl: URL }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    let current = url
    for (let hop = 0; hop < 5; hop++) {
      await assertSafeUrl(current.toString())

      const response = await fetch(current.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      })

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location) {
          throw createError({ statusCode: 502, statusMessage: 'Redirecionamento inválido.' })
        }
        current = new URL(location, current)
        continue
      }

      if (!response.ok) {
        throw createError({
          statusCode: 502,
          statusMessage: `Falha ao buscar a página (${response.status}).`,
        })
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase()
      if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        // Still allow — some sites mislabel; fall through to minimal if unparseable
      }

      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > MAX_HTML_BYTES) {
        throw createError({ statusCode: 502, statusMessage: 'Página muito grande para prévia.' })
      }
      const html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
      return { html, finalUrl: current }
    }

    throw createError({ statusCode: 502, statusMessage: 'Muitos redirecionamentos.' })
  } catch (err: any) {
    if (err?.statusCode) throw err
    if (err?.name === 'AbortError') {
      throw createError({ statusCode: 504, statusMessage: 'Tempo esgotado ao buscar o link.' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível obter a prévia do link.' })
  } finally {
    clearTimeout(timer)
  }
}

export default defineEventHandler(async (event): Promise<LinkPreviewPayload> => {
  const query = getQuery(event)
  const raw = typeof query.url === 'string' ? query.url.trim() : ''
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Parâmetro url é obrigatório.' })
  }

  const safeUrl = await assertSafeUrl(raw)

  try {
    const { html, finalUrl } = await fetchHtml(safeUrl)
    const preview = parseOg(html, finalUrl)
    if (!preview.title && !preview.description && !preview.image) {
      return minimalPreview(finalUrl.toString())
    }
    return preview
  } catch (err: any) {
    // Prefer explicit API errors for bad input / SSRF; otherwise return minimal card shape via client.
    if (err?.statusCode && err.statusCode < 500 && err.statusCode !== 404) throw err
    // Network / parse failures: still return minimal so the client keeps the media slot.
    return minimalPreview(safeUrl.toString())
  }
})
