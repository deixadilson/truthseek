<template>
  <div class="quiz-results">
    <h2 class="quiz-results-title">
      A ideologia que mais se alinha às suas convicções é:
      <span class="quiz-results-top-name">{{ topIdeologyName }}!</span>
    </h2>
    <p class="quiz-results-intro">
      Porcentagem de alinhamento com cada ideologia. Proposições em que a ideologia não tem
      posição definida contam como correspondentes.
    </p>

    <ol class="quiz-results-list">
      <li
        v-for="(row, index) in scores"
        :key="row.ideology.id"
        class="quiz-results-item"
        :class="{ top: index === 0, negative: row.scorePercent < 0 }"
      >
        <div class="quiz-results-rank">{{ index + 1 }}</div>

        <div class="quiz-results-flag-wrap">
          <img
            v-if="row.ideology.flag_path"
            :src="flagUrl(row.ideology.flag_path)"
            :alt="`Bandeira de ${row.ideology.name}`"
            class="quiz-results-flag"
          >
          <div v-else class="quiz-results-flag-placeholder">
            {{ row.ideology.name.substring(0, 1) }}
          </div>
        </div>

        <div class="quiz-results-body">
          <div class="quiz-results-head">
            <span class="quiz-results-name">{{ row.ideology.name }}</span>
            <span class="quiz-results-score" :class="scoreClass(row.scorePercent)">
              {{ formatScore(row.scorePercent) }}
            </span>
          </div>

          <p v-if="index === 0 && row.ideology.description" class="quiz-results-description">
            {{ row.ideology.description }}
          </p>

          <div class="quiz-results-bar" aria-hidden="true">
            <div class="quiz-results-bar-track">
              <div
                v-if="row.scorePercent !== 0"
                class="quiz-results-bar-fill"
                :class="row.scorePercent < 0 ? 'negative' : 'positive'"
                :style="{ width: barExtent(row.scorePercent) }"
              />
            </div>
            <span class="quiz-results-bar-zero" title="0%" />
          </div>
          <p v-if="row.scorePercent > 0" class="quiz-results-meta">
            {{ agreementLabel(row) }}
          </p>

          <div v-if="row.scorePercent > 0" class="quiz-results-actions">
            <button
              v-if="authUserId"
              type="button"
              class="button-primary"
              @click="emit('defend', row.ideology)"
            >
              Defender este viés
            </button>
            <NuxtLink
              v-else
              :to="`/user/register?redirect=${encodeURIComponent(defendRedirect)}`"
              class="button-primary"
            >
              Defender este viés
            </NuxtLink>
            <NuxtLink
              :to="`/${row.ideology.country_code}/${row.ideology.slug}`"
              class="button-secondary quiz-access-group"
            >
              Acessar grupo
            </NuxtLink>
          </div>
        </div>
      </li>
    </ol>

    <div class="quiz-results-footer">
      <button type="button" class="button-secondary quiz-restart" @click="emit('restart')">
        Refazer quiz
      </button>
      <button
        v-if="topScore"
        type="button"
        class="button-primary quiz-footer-btn"
        @click="openShareModal"
      >
        Compartilhar resultado
      </button>
    </div>

    <Dialog :open="shareModalOpen" class="quiz-share-dialog-root" @close="closeShareModal">
      <div class="quiz-share-backdrop" aria-hidden="true" />
      <div class="quiz-share-dialog-container">
        <DialogPanel class="quiz-share-panel">
          <div class="quiz-share-header">
            <DialogTitle class="quiz-share-title">Compartilhar resultado</DialogTitle>
            <button
              type="button"
              class="quiz-share-close"
              title="Fechar"
              aria-label="Fechar"
              @click="closeShareModal"
            >
              <svg
                class="quiz-share-close-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <p class="quiz-share-hint">
            Baixe a imagem ou copie o texto para postar em redes, grupos ou no seu perfil.
          </p>

          <div class="quiz-share-preview-wrap">
            <img
              v-if="sharePreviewUrl"
              :src="sharePreviewUrl"
              alt="Prévia da imagem de compartilhamento do resultado do quiz"
              class="quiz-share-preview"
            >
            <div v-else class="quiz-share-preview-loading">
              <LoadingMessage message="Gerando imagem..." :icon-size="18" />
            </div>
          </div>

          <textarea
            class="quiz-share-caption"
            readonly
            rows="4"
            :value="shareCaption"
            aria-label="Texto para compartilhar"
          />

          <div class="quiz-share-actions">
            <div class="quiz-share-actions-row">
              <button
                type="button"
                class="button-primary quiz-share-action-btn"
                :disabled="!shareBlob || shareBusy || isPublishing"
                @click="downloadShareImage"
              >
                Baixar imagem
              </button>
              <button
                type="button"
                class="button-secondary quiz-share-action-btn"
                :disabled="shareBusy || isPublishing"
                @click="copyShareCaption"
              >
                Copiar texto
              </button>
              <button
                v-if="canNativeShare"
                type="button"
                class="button-secondary quiz-share-action-btn"
                :disabled="!shareBlob || shareBusy || isPublishing"
                @click="nativeShare"
              >
                Compartilhar
              </button>
            </div>
            <button
              v-if="hostGroupId"
              type="button"
              class="button-secondary quiz-share-publish"
              :disabled="!shareBlob || shareBusy || isPublishing"
              @click="publishToHostGroup"
            >
              <LoadingMessage
                v-if="isPublishing"
                message="Publicando..."
                :icon-size="14"
              />
              <template v-else>
                Publicar no grupo {{ hostGroupName }}
              </template>
            </button>
          </div>

          <p v-if="publishedPostId" class="quiz-share-published">
            Publicado.
            <NuxtLink :to="`/post/${publishedPostId}`">Ver post</NuxtLink>
            <template v-if="hostGroupSlug">
              ·
              <NuxtLink :to="`/${hostGroupCountryCode}/${hostGroupSlug}`">
                Ir ao grupo
              </NuxtLink>
            </template>
          </p>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { useToast } from 'vue-toastification';
import type { Database } from '~/types/supabase';
import type { IdeologyScore, QuizIdeology } from '~/utils/quizScoring';
import { buildQuizShareCaption, renderQuizResultImage } from '~/utils/quizShareImage';
import { publishQuizResultPost } from '~/utils/quizSharePost';

const props = defineProps<{
  scores: IdeologyScore[];
  defendRedirect: string;
  quizUrl: string;
  quizTitle?: string;
  hostGroupId?: string;
  hostGroupName?: string;
  hostGroupSlug?: string;
  hostGroupCountryCode?: string;
}>();

const emit = defineEmits<{
  (e: 'defend', ideology: QuizIdeology): void;
  (e: 'restart'): void;
}>();

const supabase = useSupabaseClient<Database>();
const authUserId = useAuthUserId();
const userProfile = useProfile();
const toast = useToast();
const flagsBucket = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags';

const topScore = computed(() => props.scores[0] || null);
const topIdeologyName = computed(() => topScore.value?.ideology.name || '—');
const hostGroupName = computed(() => props.hostGroupName || 'Ideologias Políticas');

const shareModalOpen = ref(false);
const shareBlob = ref<Blob | null>(null);
const sharePreviewUrl = ref<string | null>(null);
const shareBusy = ref(false);
const canNativeShare = ref(false);
const isPublishing = ref(false);
const publishedPostId = ref<string | null>(null);

const shareCaption = computed(() => {
  const top = topScore.value;
  if (!top) return '';
  return buildQuizShareCaption({
    ideologyName: top.ideology.name,
    scorePercent: top.scorePercent,
    quizUrl: props.quizUrl,
    quizTitle: props.quizTitle || 'Quiz Ideologias Políticas',
  });
});

onMounted(() => {
  canNativeShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
});

watch(
  () => [topScore.value?.ideology.id, topScore.value?.scorePercent, props.quizTitle] as const,
  () => {
    publishedPostId.value = null;
    void regenerateShareImage();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (sharePreviewUrl.value) URL.revokeObjectURL(sharePreviewUrl.value);
});

function openShareModal() {
  shareModalOpen.value = true;
  publishedPostId.value = null;
  if (!sharePreviewUrl.value) void regenerateShareImage();
}

function closeShareModal() {
  shareModalOpen.value = false;
}

async function publishToHostGroup() {
  const top = topScore.value;
  if (!top || !shareBlob.value || !props.hostGroupId) return;

  if (!authUserId.value) {
    toast.info('É necessário criar uma conta para publicar. Cadastre-se ou faça login.');
    await navigateTo(`/user/register?redirect=${encodeURIComponent(props.defendRedirect)}`);
    return;
  }

  isPublishing.value = true;
  try {
    const post = await publishQuizResultPost({
      supabase,
      authorId: authUserId.value,
      hostGroupId: props.hostGroupId,
      ideologyId: top.ideology.id,
      scorePercent: top.scorePercent,
      imageBlob: shareBlob.value,
      textContent: shareCaption.value,
      isModerated: !!userProfile.value?.default_moderated_posts,
    });
    publishedPostId.value = post.id;
    toast.success('Resultado publicado no grupo.');
  } catch (e: any) {
    console.error(e);
    toast.error(e?.message || 'Não foi possível publicar o resultado.');
  } finally {
    isPublishing.value = false;
  }
}

async function regenerateShareImage() {
  const top = topScore.value;
  if (!top || !import.meta.client) return;

  shareBusy.value = true;
  try {
    const blob = await renderQuizResultImage({
      ideologyName: top.ideology.name,
      scorePercent: top.scorePercent,
      flagUrl: top.ideology.flag_path ? flagUrl(top.ideology.flag_path) : null,
      quizTitle: props.quizTitle || 'Quiz Ideologias Políticas',
    });
    if (sharePreviewUrl.value) URL.revokeObjectURL(sharePreviewUrl.value);
    shareBlob.value = blob;
    sharePreviewUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    console.error(e);
    shareBlob.value = null;
    if (sharePreviewUrl.value) {
      URL.revokeObjectURL(sharePreviewUrl.value);
      sharePreviewUrl.value = null;
    }
  } finally {
    shareBusy.value = false;
  }
}

function downloadShareImage() {
  if (!shareBlob.value || !topScore.value) return;
  const url = URL.createObjectURL(shareBlob.value);
  const a = document.createElement('a');
  const safeName = topScore.value.ideology.name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-');
  a.href = url;
  a.download = `truthseek-quiz-${safeName}-${topScore.value.scorePercent}.png`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Imagem baixada.');
}

async function copyShareCaption() {
  try {
    await navigator.clipboard.writeText(shareCaption.value);
    toast.success('Texto copiado.');
  } catch {
    toast.error('Não foi possível copiar o texto.');
  }
}

async function nativeShare() {
  if (!shareBlob.value || !topScore.value) return;
  shareBusy.value = true;
  try {
    const file = new File(
      [shareBlob.value],
      `truthseek-quiz-${topScore.value.scorePercent}.png`,
      { type: 'image/png' }
    );
    const data: ShareData = {
      title: 'TruthSeek Network',
      text: shareCaption.value,
      url: props.quizUrl,
    };
    if (navigator.canShare?.({ files: [file] })) {
      data.files = [file];
    }
    await navigator.share(data);
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      console.error(e);
      toast.error('Não foi possível compartilhar.');
    }
  } finally {
    shareBusy.value = false;
  }
}

function flagUrl(path: string): string {
  return `${flagsBucket}/${path}`;
}

function formatScore(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

function scoreClass(pct: number): string {
  if (pct > 0) return 'high';
  if (pct === 0) return 'mid';
  return 'low';
}

function agreementLabel(row: IdeologyScore): string {
  const { agreedCount, totalCount } = row;
  const resposta = agreedCount === 1 ? 'resposta de acordo' : 'respostas de acordo';
  return `${agreedCount} de ${totalCount} ${resposta} com esta ideologia`;
}

function barExtent(pct: number): string {
  const extent = Math.max(0, Math.min(50, Math.abs(pct) / 2));
  return `${extent}%`;
}
</script>

<style scoped>
.quiz-results-title {
  margin: 0 0 0.35rem;
  font-size: 1.45rem;
  color: var(--primary-color-dark);
  line-height: 1.35;
}

.quiz-results-top-name {
  color: var(--primary-color);
  font-weight: 700;
  font-size: 1.5em;
}

.quiz-results-intro {
  margin: 0 0 1.25rem;
  color: #666;
  font-size: 0.95rem;
}

.quiz-results-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.quiz-results-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
}

.quiz-results-item.top {
  gap: 1rem;
  padding: 1.25rem 1.25rem;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary-color) 30%, transparent);
}

.quiz-results-rank {
  flex: 0 0 auto;
  min-width: 1.25rem;
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
  background: none;
  color: var(--text-color);
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.2;
  margin-top: 0.2rem;
}

.quiz-results-item.top .quiz-results-rank {
  font-size: 1.45rem;
  margin-top: 0.05rem;
}

.quiz-results-flag-wrap {
  flex: 0 0 auto;
  margin-top: 0.1rem;
}

.quiz-results-flag,
.quiz-results-flag-placeholder {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
  background: #f0f0f0;
}

.quiz-results-item.top .quiz-results-flag,
.quiz-results-item.top .quiz-results-flag-placeholder {
  width: 3.25rem;
  height: 3.25rem;
}

.quiz-results-flag-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--primary-color-dark);
  font-size: 0.95rem;
}

.quiz-results-body {
  flex: 1;
  min-width: 0;
}

.quiz-results-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.quiz-results-name {
  font-weight: 600;
  font-size: 1.05rem;
}

.quiz-results-item.top .quiz-results-name {
  font-size: 1.35rem;
}

.quiz-results-item.top .quiz-results-score {
  font-size: 1.2rem;
}

.quiz-results-description {
  margin: 0 0 0.65rem;
  font-size: 0.92rem;
  line-height: 1.45;
  color: #555;
}

.quiz-results-score {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.quiz-results-score.high { color: #2e7d32; }
.quiz-results-score.mid { color: #555; }
.quiz-results-score.low { color: #c62828; }

.quiz-results-bar {
  position: relative;
  padding: 3px 0;
}

.quiz-results-bar-track {
  position: relative;
  height: 0.4rem;
  border-radius: 999px;
  overflow: hidden;
  background: linear-gradient(
    to right,
    #ef9a9a 0%,
    #ef9a9a 50%,
    var(--primary-color-light) 50%,
    var(--primary-color-light) 100%
  );
}

.quiz-results-item.top .quiz-results-bar-track {
  height: 0.5rem;
}

.quiz-results-bar-zero {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: calc(100% + 2px);
  transform: translate(-50%, -50%);
  background: #757575;
  border-radius: 1px;
  z-index: 2;
  pointer-events: none;
}

.quiz-results-bar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
}

.quiz-results-bar-fill.positive {
  left: 50%;
  background: var(--primary-color);
  border-radius: 0 999px 999px 0;
}

.quiz-results-bar-fill.negative {
  right: 50%;
  background: #c62828;
  border-radius: 999px 0 0 999px;
}

.quiz-results-meta {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: #888;
}

.quiz-results-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.quiz-access-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55em 1em;
  text-decoration: none;
  box-sizing: border-box;
}

.quiz-results-footer {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.quiz-share-dialog-root {
  position: relative;
  z-index: 100;
}

.quiz-share-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.45);
}

.quiz-share-dialog-container {
  position: fixed;
  inset: 0;
  z-index: 1101;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.quiz-share-panel {
  width: min(100%, 28rem);
  max-height: min(90vh, 44rem);
  overflow-y: auto;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 1.15rem 1.25rem 1.2rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}

.quiz-share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.quiz-share-title {
  margin: 0;
  font-size: 1.15rem;
  color: var(--primary-color-dark);
}

.quiz-share-close {
  flex: 0 0 auto;
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
  line-height: 0;
}

.quiz-share-close-icon {
  display: block;
  flex-shrink: 0;
}

.quiz-share-close:hover,
.quiz-share-close:focus {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.quiz-share-hint {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: #666;
}

.quiz-share-preview-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 0.85rem;
}

.quiz-share-preview {
  width: min(100%, 280px);
  aspect-ratio: 1;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  object-fit: cover;
  background: #fff;
}

.quiz-share-preview-loading {
  width: min(100%, 280px);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed var(--border-color);
  background: #fafafa;
}

.quiz-share-caption {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0.85rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--text-color);
  background: #fff;
  resize: vertical;
}

.quiz-share-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-share-actions-row {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.quiz-share-action-btn {
  flex: 0 0 calc((100% - 1rem) / 3);
  width: calc((100% - 1rem) / 3);
  min-width: 0;
  box-sizing: border-box;
  text-align: center;
  padding-left: 0.35em;
  padding-right: 0.35em;
}

.quiz-share-publish {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.quiz-share-published {
  margin: 0.85rem 0 0;
  font-size: 0.9rem;
  color: #555;
}

.quiz-share-published a {
  color: var(--primary-color);
  font-weight: 600;
}

.quiz-restart,
.quiz-footer-btn {
  padding: 0.7em 1.2em;
  line-height: 1.4;
  box-sizing: border-box;
}
</style>
