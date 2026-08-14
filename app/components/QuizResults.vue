<template>
  <div class="quiz-results">
    <h2 class="quiz-results-title">
      A ideologia que mais se alinha às suas convicções é
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
              :to="`/user/login?redirect=${encodeURIComponent(defendRedirect)}`"
              class="button-primary"
            >
              Entrar para defender este viés
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
      <button type="button" class="button-tertiary quiz-restart" @click="emit('restart')">
        Refazer quiz
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IdeologyScore, QuizIdeology } from '~/utils/quizScoring';

const props = defineProps<{
  scores: IdeologyScore[];
  defendRedirect: string;
}>();

const emit = defineEmits<{
  (e: 'defend', ideology: QuizIdeology): void;
  (e: 'restart'): void;
}>();

const authUserId = useAuthUserId();
const flagsBucket = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags';

const topIdeologyName = computed(() => props.scores[0]?.ideology.name || '—');

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
}

.quiz-restart {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5em 1em;
  background-color: transparent;
}

.quiz-restart:hover,
.quiz-restart:focus {
  background-color: transparent !important;
  border-color: var(--primary-color);
  color: var(--primary-color-dark);
}
</style>
