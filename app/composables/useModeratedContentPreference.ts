const STORAGE_KEY = 'truthseek:prefer-moderated-only';

export function useModeratedContentPreference() {
  const preferModeratedOnly = ref(false);

  function readStored(): boolean {
    if (!import.meta.client) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function writeStored(value: boolean) {
    if (!import.meta.client) return;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, '1');
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore quota / private mode
    }
  }

  onMounted(() => {
    preferModeratedOnly.value = readStored();
  });

  watch(preferModeratedOnly, (value) => {
    writeStored(value);
  });

  return { preferModeratedOnly };
}
