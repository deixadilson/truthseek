import {
  extractAveragedDarkenedColor,
  extractDarkenedDominantColor,
  FLAG_THEME_FALLBACK,
} from '~/utils/dominantColor';

/**
 * Reactive fallback cover color derived from one or more flag image URLs.
 * Safe on SSR (stays at CSS variable until client extraction finishes).
 */
export function useFlagTheme(
  flagUrls: MaybeRefOrGetter<string | string[] | null | undefined>
) {
  const fallbackColor = ref(FLAG_THEME_FALLBACK);

  async function refresh() {
    if (!import.meta.client) {
      fallbackColor.value = FLAG_THEME_FALLBACK;
      return;
    }

    const raw = toValue(flagUrls);
    const urls = (Array.isArray(raw) ? raw : raw ? [raw] : [])
      .map((u) => String(u || '').trim())
      .filter(Boolean);

    if (urls.length === 0) {
      fallbackColor.value = FLAG_THEME_FALLBACK;
      return;
    }

    fallbackColor.value = urls.length === 1
      ? await extractDarkenedDominantColor(urls[0]!)
      : await extractAveragedDarkenedColor(urls);
  }

  watch(
    () => {
      const raw = toValue(flagUrls);
      if (Array.isArray(raw)) return raw.filter(Boolean).join('|');
      return raw || '';
    },
    () => {
      void refresh();
    },
    { immediate: true }
  );

  return {
    fallbackColor,
    refresh,
  };
}
