export type Rgb = { r: number; g: number; b: number };

const DEFAULT_FALLBACK_CSS = 'var(--primary-color-light)';
const colorCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const SAMPLE_SIZE = 40;
const BUCKET = 24;
/** Multiply RGB channels after picking the dominant color. */
const DARKEN_FACTOR = 0.75;

export function rgbToCss(rgb: Rgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function darkenRgb(rgb: Rgb, factor = DARKEN_FACTOR): Rgb {
  return {
    r: Math.max(0, Math.min(255, Math.round(rgb.r * factor))),
    g: Math.max(0, Math.min(255, Math.round(rgb.g * factor))),
    b: Math.max(0, Math.min(255, Math.round(rgb.b * factor))),
  };
}

export function averageRgb(colors: Rgb[]): Rgb | null {
  if (colors.length === 0) return null;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const c of colors) {
    r += c.r;
    g += c.g;
    b += c.b;
  }
  const n = colors.length;
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n),
  };
}

function isSkippablePixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 32) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (min > 235) return true;
  if (max < 28) return true;
  return false;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

async function sampleDominantCss(url: string): Promise<string> {
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return DEFAULT_FALLBACK_CSS;

    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const a = data[i + 3]!;
      if (isSkippablePixel(r, g, b, a)) continue;

      const qr = Math.round(r / BUCKET) * BUCKET;
      const qg = Math.round(g / BUCKET) * BUCKET;
      const qb = Math.round(b / BUCKET) * BUCKET;
      const key = `${qr},${qg},${qb}`;
      const entry = buckets.get(key);
      if (entry) {
        entry.count += 1;
        entry.r += r;
        entry.g += g;
        entry.b += b;
      } else {
        buckets.set(key, { count: 1, r, g, b });
      }
    }

    if (buckets.size === 0) return DEFAULT_FALLBACK_CSS;

    let best: { count: number; r: number; g: number; b: number } | null = null;
    for (const entry of buckets.values()) {
      if (!best || entry.count > best.count) best = entry;
    }
    if (!best) return DEFAULT_FALLBACK_CSS;

    return rgbToCss(
      darkenRgb({
        r: Math.round(best.r / best.count),
        g: Math.round(best.g / best.count),
        b: Math.round(best.b / best.count),
      })
    );
  } catch {
    return DEFAULT_FALLBACK_CSS;
  }
}

/**
 * Sample a flag/cover-like image and return its darkened dominant CSS color.
 * Returns DEFAULT_FALLBACK_CSS on failure (CORS, SVG logo, empty, etc.).
 */
export async function extractDarkenedDominantColor(url: string): Promise<string> {
  if (!url || url.endsWith('.svg') || url.includes('logo.svg')) {
    return DEFAULT_FALLBACK_CSS;
  }

  const cached = colorCache.get(url);
  if (cached) return cached;

  let job = inflight.get(url);
  if (!job) {
    job = sampleDominantCss(url).finally(() => {
      inflight.delete(url);
    });
    inflight.set(url, job);
  }

  const result = await job;
  if (result !== DEFAULT_FALLBACK_CSS) {
    colorCache.set(url, result);
  }
  return result;
}

/**
 * Average darkened dominant colors from multiple flag URLs (e.g. VS sides).
 */
export async function extractAveragedDarkenedColor(urls: string[]): Promise<string> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return DEFAULT_FALLBACK_CSS;

  const colors: Rgb[] = [];
  for (const url of unique) {
    const css = await extractDarkenedDominantColor(url);
    if (css === DEFAULT_FALLBACK_CSS) continue;
    const match = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(css);
    if (!match) continue;
    colors.push({
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
    });
  }

  const avg = averageRgb(colors);
  return avg ? rgbToCss(avg) : DEFAULT_FALLBACK_CSS;
}

export const FLAG_THEME_FALLBACK = DEFAULT_FALLBACK_CSS;
