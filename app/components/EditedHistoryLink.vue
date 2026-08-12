<template>
  <span class="edited-history">
    <button
      type="button"
      class="edited-link"
      @click="openHistory"
      title="Ver versões anteriores"
    >
      Editado
    </button>

    <Dialog :open="isOpen" @close="closeHistory" class="history-dialog-root">
      <div class="history-backdrop" aria-hidden="true" />

      <div class="history-dialog-container">
        <DialogPanel class="history-panel">
          <div class="history-panel-header">
            <DialogTitle class="history-title">Histórico de edições</DialogTitle>
            <button
              type="button"
              class="history-close-icon"
              title="Fechar"
              @click="closeHistory"
            >
              <Icon name="lucide:x" :size="18" />
            </button>
          </div>

          <div v-if="isLoading" class="history-status">
            <LoadingMessage message="Carregando versões..." :icon-size="14" />
          </div>
          <div v-else-if="error" class="history-status error">{{ error }}</div>
          <div v-else-if="revisions.length === 0" class="history-status">
            Nenhuma versão anterior encontrada.
          </div>
          <template v-else>
            <div class="history-meta">
              <span class="history-label">
                Versão anterior {{ currentIndex + 1 }} de {{ revisions.length }}
              </span>
              <span class="history-date" v-if="currentRevision">
                {{ formatDate(currentRevision.created_at, true) }}
              </span>
            </div>

            <div class="history-body" v-if="currentRevision">
              <p
                v-if="currentRevision.text_content"
                class="history-text"
                v-html="formatTextToHtml(currentRevision.text_content)"
              ></p>
              <p v-else class="history-empty-text">(sem texto nesta versão)</p>

              <div v-if="currentRevision.image_path" class="history-media">
                <img :src="revisionImageUrl" alt="Imagem da versão anterior" />
              </div>
              <div v-if="revisionEmbedUrl" class="history-media">
                <iframe :src="revisionEmbedUrl" frameborder="0" allowfullscreen></iframe>
              </div>
            </div>

            <div v-if="revisions.length > 1" class="history-nav">
              <button
                type="button"
                class="history-nav-btn"
                :disabled="currentIndex <= 0"
                @click="currentIndex--"
              >
                <Icon name="lucide:chevron-left" :size="16" />
                Anterior
              </button>
              <button
                type="button"
                class="history-nav-btn"
                :disabled="currentIndex >= revisions.length - 1"
                @click="currentIndex++"
              >
                Próxima
                <Icon name="lucide:chevron-right" :size="16" />
              </button>
            </div>
          </template>
        </DialogPanel>
      </div>
    </Dialog>
  </span>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import type { Database } from '~/types/supabase';
import { formatDate, formatTextToHtml, getEmbedVideoUrl } from '~/utils/formatters';

type ContentRevision = Database['public']['Tables']['content_revisions']['Row'];

const props = defineProps<{
  targetType: 'post' | 'comment';
  targetId: string;
  mediaBucket?: 'post-media' | 'comment-media';
}>();

const supabase = useSupabaseClient<Database>();

const isOpen = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const revisions = ref<ContentRevision[]>([]);
const currentIndex = ref(0);
const loaded = ref(false);

const currentRevision = computed(() => revisions.value[currentIndex.value] || null);

const revisionImageUrl = computed(() => {
  const path = currentRevision.value?.image_path;
  if (!path) return '';
  const bucket = props.mediaBucket || (props.targetType === 'post' ? 'post-media' : 'comment-media');
  return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/${bucket}/${path}`;
});

const revisionEmbedUrl = computed(() => getEmbedVideoUrl(currentRevision.value?.video_url ?? null));

async function loadRevisions() {
  if (loaded.value || isLoading.value) return;
  isLoading.value = true;
  error.value = null;
  try {
    const { data, error: fetchError } = await supabase
      .from('content_revisions')
      .select('*')
      .eq('target_type', props.targetType)
      .eq('target_id', props.targetId)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;
    revisions.value = data || [];
    currentIndex.value = Math.max(0, revisions.value.length - 1);
    loaded.value = true;
  } catch (e: any) {
    error.value = e.message || 'Falha ao carregar versões.';
  } finally {
    isLoading.value = false;
  }
}

async function openHistory() {
  isOpen.value = true;
  await loadRevisions();
}

function closeHistory() {
  isOpen.value = false;
}
</script>

<style scoped>
.edited-history {
  display: inline;
}

.edited-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-size: inherit;
  color: var(--primary-color);
  text-decoration: underline;
  cursor: pointer;
}

.edited-link:hover {
  color: var(--primary-color-hover);
}

.history-dialog-root {
  position: relative;
  z-index: 1000;
}

.history-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 32, 0.45);
}

.history-dialog-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.history-panel {
  width: min(100%, 34rem);
  max-height: min(85vh, 36rem);
  overflow-y: auto;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  text-align: left;
}

.history-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.history-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--primary-color);
}

.history-close-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
}

.history-close-icon:hover {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.history-status {
  font-size: 0.85rem;
  color: #666;
}

.history-status.error {
  color: #b81727;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}

.history-label {
  font-weight: 600;
  color: var(--text-color);
}

.history-date {
  color: #777;
}

.history-text {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #444;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.history-empty-text {
  margin: 0;
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
}

.history-media {
  margin-top: 0.75rem;
}

.history-media img {
  max-width: 100%;
  max-height: 280px;
  border-radius: 4px;
  display: block;
}

.history-media iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 280px;
  border-radius: 4px;
}

.history-nav {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border-color);
}

.history-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4em 0.75em;
  font-size: 0.8rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--primary-color);
  cursor: pointer;
}

.history-nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.history-nav-btn:not(:disabled):hover {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
}
</style>
