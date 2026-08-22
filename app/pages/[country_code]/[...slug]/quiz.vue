<template>
  <div class="quiz-page container">
    <div v-if="isLoading" class="quiz-state">
      <LoadingMessage message="Carregando quiz..." />
    </div>

    <div v-else-if="loadError" class="quiz-state quiz-error">
      <p>{{ loadError }}</p>
      <NuxtLink v-if="groupPath" :to="groupPath" class="button-secondary">Voltar ao grupo</NuxtLink>
    </div>

    <template v-else-if="quiz && hostGroup">
      <header class="quiz-header">
        <NuxtLink :to="groupPath" class="quiz-back">
          <Icon name="lucide:arrow-left" :size="16" />
          {{ hostGroup.name }}
        </NuxtLink>
        <h1>Quiz: {{ hostGroup.name }}</h1>
        <p v-if="phase !== 'results'" class="quiz-subtitle">
          {{ quizSubtitle }}
        </p>
      </header>

      <template v-if="phase === 'intro'">
        <div class="quiz-card card-style">
          <p>
            {{ introCopy }}
          </p>
          <button type="button" class="button-primary" @click="startQuiz">
            Começar
          </button>
        </div>
      </template>

      <template v-else-if="phase === 'questions'">
        <div class="quiz-progress" aria-live="polite">
          {{ isChoiceMode ? 'Pergunta' : 'Proposição' }}
          {{ currentIndex + 1 }} de {{ quiz.propositions.length }}
        </div>
        <div class="quiz-progress-bar" aria-hidden="true">
          <div class="quiz-progress-fill" :style="{ width: progressPct }" />
        </div>

        <div class="quiz-card card-style">
          <h2 class="quiz-question">{{ currentProposition?.statement }}</h2>
          <QuizOptionList
            v-if="isChoiceMode"
            :options="currentChoiceOptions"
            :model-value="currentChoiceAnswer"
            aria-label="Sua resposta"
            @update:model-value="setChoiceAnswer"
          />
          <QuizLikertScale
            v-else
            :model-value="currentLikertAnswer"
            aria-label="Seu posicionamento"
            @update:model-value="setLikertAnswer"
          />
          <div class="quiz-nav">
            <button
              type="button"
              class="button-secondary"
              :disabled="currentIndex === 0"
              @click="goPrev"
            >
              Anterior
            </button>
            <button
              type="button"
              class="button-primary"
              :disabled="!hasCurrentAnswer"
              @click="goNext"
            >
              {{ isLast ? 'Ver resultado' : 'Próxima' }}
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="phase === 'results'">
        <QuizResults
          :scores="scores"
          :defend-redirect="quizPath"
          :quiz-url="quizAbsoluteUrl"
          :quiz-title="hostGroup ? `Quiz ${hostGroup.name}` : 'Quiz'"
          :host-group-id="hostGroup?.id || ''"
          :host-group-name="hostGroup?.name || ''"
          :host-group-slug="hostGroup?.slug || ''"
          :host-group-country-code="hostGroup?.country_code || country"
          :bar-mode="isChoiceMode ? 'unipolar' : 'bipolar'"
          :result-noun="isChoiceMode ? 'caminho' : 'ideologia'"
          @defend="openDefend"
          @restart="restart"
        />
      </template>
    </template>

    <DeclareBiasPremisesDialog
      :open="declareBiasDialogOpen"
      :group-id="pendingDefendId"
      :group-name="pendingDefendName"
      :busy="isDeclaringBias"
      @close="declareBiasDialogOpen = false"
      @confirm="confirmDeclareBias"
    />
  </div>
</template>

<script setup lang="ts">
import type { Group } from '~/types/app';
import {
  resolveQuizMode,
  scoreChoiceGroups,
  scoreIdeologies,
  shuffleArray,
  type IdeologyScore,
  type LikertStance,
  type QuizChoiceOption,
  type QuizIdeology,
  type QuizPayload,
  type QuizProposition,
} from '~/utils/quizScoring';
import { useToast } from 'vue-toastification';

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const authUserId = useAuthUserId();

const country = computed(() => {
  const c = route.params.country_code;
  return typeof c === 'string' ? c : Array.isArray(c) ? c[0] : '';
});

const groupSlug = computed(() => {
  const s = route.params.slug;
  if (Array.isArray(s)) return s.join('/');
  return typeof s === 'string' ? s : '';
});

const groupPath = computed(() => `/${country.value}/${groupSlug.value}`);
const quizPath = computed(() => `${groupPath.value}/quiz`);

const requestURL = useRequestURL();
const quizAbsoluteUrl = computed(() => {
  if (import.meta.client && typeof window !== 'undefined') {
    return `${window.location.origin}${quizPath.value}`;
  }
  return `${requestURL.origin}${quizPath.value}`;
});

const isLoading = ref(true);
const loadError = ref('');
const hostGroup = ref<Pick<Group, 'id' | 'name' | 'slug' | 'country_code' | 'has_subgroups'> | null>(null);
const quiz = ref<QuizPayload | null>(null);

const phase = ref<'intro' | 'questions' | 'results'>('intro');
const currentIndex = ref(0);
const likertAnswers = ref<Record<string, LikertStance>>({});
const choiceAnswers = ref<Record<string, string>>({});
/** Per-proposition shuffled option order for choice quizzes (stable within an attempt). */
const shuffledOptionsByPropId = ref<Record<string, QuizChoiceOption[]>>({});
const scores = ref<IdeologyScore[]>([]);
const attemptId = ref<string | null>(null);

const declareBiasDialogOpen = ref(false);
const pendingDefendId = ref<string | null>(null);
const pendingDefendName = ref('');
const isDeclaringBias = ref(false);

const isChoiceMode = computed(() => resolveQuizMode(quiz.value) === 'choice');

const quizSubtitle = computed(() => {
  if (isChoiceMode.value) {
    return 'Escolha, em cada pergunta, a resposta que mais se parece com o que você sente.';
  }
  return 'Responda às proposições para estimar com quais ideologias você mais se alinha.';
});

const introCopy = computed(() => {
  const n = quiz.value?.propositions.length || 0;
  if (isChoiceMode.value) {
    return `São ${n} perguntas. Em cada uma, escolha a opção que mais se parece com você — sem rótulos religiosos. Ao final, mostramos a afinidade percentual com cada caminho.`;
  }
  return `São ${n} proposições. Para cada uma, escolha o quanto você concorda. Ao final, mostramos o alinhamento percentual com cada ideologia.`;
});

const currentProposition = computed<QuizProposition | null>(() => {
  const list = quiz.value?.propositions || [];
  return list[currentIndex.value] || null;
});

const currentLikertAnswer = computed<LikertStance | null>(() => {
  const id = currentProposition.value?.id;
  if (!id) return null;
  return likertAnswers.value[id] ?? null;
});

const currentChoiceAnswer = computed<string | null>(() => {
  const id = currentProposition.value?.id;
  if (!id) return null;
  return choiceAnswers.value[id] ?? null;
});

const currentChoiceOptions = computed<QuizChoiceOption[]>(() => {
  const id = currentProposition.value?.id;
  if (!id) return [];
  return shuffledOptionsByPropId.value[id] || currentProposition.value?.options || [];
});

const hasCurrentAnswer = computed(() => {
  if (isChoiceMode.value) return currentChoiceAnswer.value !== null;
  return currentLikertAnswer.value !== null;
});

const isLast = computed(() => {
  const n = quiz.value?.propositions.length || 0;
  return currentIndex.value >= n - 1;
});

const progressPct = computed(() => {
  const n = quiz.value?.propositions.length || 1;
  return `${((currentIndex.value + 1) / n) * 100}%`;
});

async function loadQuiz() {
  isLoading.value = true;
  loadError.value = '';
  quiz.value = null;
  hostGroup.value = null;

  try {
    if (!country.value || !groupSlug.value) {
      loadError.value = 'URL do quiz incompleta.';
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, has_subgroups')
      .eq('country_code', country.value)
      .eq('slug', groupSlug.value)
      .maybeSingle();

    if (groupError) throw groupError;
    if (!group) {
      loadError.value = 'Grupo não encontrado.';
      return;
    }

    hostGroup.value = group;

    const { data, error } = await supabase.rpc('get_quiz_for_group', {
      p_host_group_id: group.id,
    });

    if (error) throw error;

    const payload = data as QuizPayload | null;
    if (!payload?.propositions?.length) {
      loadError.value = 'Este grupo ainda não possui quiz disponível.';
      return;
    }

    payload.mode = resolveQuizMode(payload);
    payload.propositions = payload.propositions.map((p) => ({
      ...p,
      stances: Object.fromEntries(
        Object.entries(p.stances || {}).map(([k, v]) => [
          k,
          v === null || v === undefined ? null : Number(v),
        ])
      ),
      options: (p.options || []).map((o) => ({
        ...o,
        sort_order: Number(o.sort_order),
      })),
    }));

    quiz.value = payload;
  } catch (e: any) {
    console.error(e);
    loadError.value = e.message || 'Falha ao carregar o quiz.';
  } finally {
    isLoading.value = false;
  }
}

function shuffleChoiceOptions() {
  if (!quiz.value || resolveQuizMode(quiz.value) !== 'choice') {
    shuffledOptionsByPropId.value = {};
    return;
  }
  const next: Record<string, QuizChoiceOption[]> = {};
  for (const prop of quiz.value.propositions) {
    next[prop.id] = shuffleArray(prop.options || []);
  }
  shuffledOptionsByPropId.value = next;
}

function startQuiz() {
  phase.value = 'questions';
  currentIndex.value = 0;
  likertAnswers.value = {};
  choiceAnswers.value = {};
  scores.value = [];
  attemptId.value = null;
  shuffleChoiceOptions();
  void createAttempt();
}

async function createAttempt() {
  if (!hostGroup.value) return;
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        host_group_id: hostGroup.value.id,
        user_id: authUserId.value || null,
      })
      .select('id')
      .single();
    if (error) throw error;
    attemptId.value = data.id;
  } catch (e) {
    console.error('Falha ao criar tentativa de quiz:', e);
  }
}

function setLikertAnswer(value: LikertStance) {
  const id = currentProposition.value?.id;
  if (!id) return;
  likertAnswers.value = { ...likertAnswers.value, [id]: value };
}

function setChoiceAnswer(groupId: string) {
  const id = currentProposition.value?.id;
  if (!id) return;
  choiceAnswers.value = { ...choiceAnswers.value, [id]: groupId };
}

function goPrev() {
  if (currentIndex.value > 0) currentIndex.value -= 1;
}

async function goNext() {
  if (!hasCurrentAnswer.value) return;
  if (!isLast.value) {
    currentIndex.value += 1;
    return;
  }
  await finishQuiz();
}

async function finishQuiz() {
  if (!quiz.value) return;
  if (isChoiceMode.value) {
    scores.value = scoreChoiceGroups(
      quiz.value.ideologies,
      quiz.value.propositions,
      choiceAnswers.value
    );
  } else {
    scores.value = scoreIdeologies(
      quiz.value.ideologies,
      quiz.value.propositions,
      likertAnswers.value
    );
  }
  phase.value = 'results';
  await persistAnswers();
}

async function persistAnswers() {
  if (!attemptId.value || !quiz.value) return;
  try {
    const rows = isChoiceMode.value
      ? quiz.value.propositions
          .filter((p) => choiceAnswers.value[p.id])
          .map((p) => ({
            attempt_id: attemptId.value!,
            proposition_id: p.id,
            answer: null as number | null,
            chosen_group_id: choiceAnswers.value[p.id],
          }))
      : quiz.value.propositions
          .filter((p) => likertAnswers.value[p.id] !== undefined)
          .map((p) => ({
            attempt_id: attemptId.value!,
            proposition_id: p.id,
            answer: likertAnswers.value[p.id],
            chosen_group_id: null as string | null,
          }));

    if (rows.length) {
      const { error } = await supabase.from('quiz_attempt_answers').insert(rows);
      if (error) throw error;
    }

    const { error: updError } = await supabase
      .from('quiz_attempts')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', attemptId.value);
    if (updError) throw updError;
  } catch (e) {
    console.error('Falha ao salvar respostas do quiz:', e);
  }
}

function restart() {
  phase.value = 'intro';
  currentIndex.value = 0;
  likertAnswers.value = {};
  choiceAnswers.value = {};
  shuffledOptionsByPropId.value = {};
  scores.value = [];
  attemptId.value = null;
}

function openDefend(ideology: QuizIdeology) {
  pendingDefendId.value = ideology.id;
  pendingDefendName.value = ideology.name;
  declareBiasDialogOpen.value = true;
}

async function confirmDeclareBias() {
  if (!pendingDefendId.value || !authUserId.value || isDeclaringBias.value) return;
  isDeclaringBias.value = true;
  const groupId = pendingDefendId.value;
  const ideology = scores.value.find((s) => s.ideology.id === groupId)?.ideology;

  try {
    const { data: checkData, error: checkError } = await supabase.rpc('can_declare_bias', {
      p_user_id: authUserId.value,
      p_group_id_to_declare: groupId,
    });
    if (checkError) throw checkError;

    const result = checkData?.[0];
    if (result && !result.can_declare) {
      toast.error(result.reason || 'Não foi possível declarar este viés.');
      return;
    }

    const { error } = await supabase.from('biases').insert({
      user_id: authUserId.value,
      group_id: groupId,
      influence_points: 10,
    });
    if (error) {
      if (error.message?.includes('unique constraint') || error.code === '23505') {
        toast.info('Você já declarou este viés.');
      } else {
        throw error;
      }
    } else {
      toast.success('Viés declarado com sucesso!');
    }

    declareBiasDialogOpen.value = false;
    if (ideology) {
      await navigateTo(`/${ideology.country_code}/${ideology.slug}`);
    }
  } catch (e: any) {
    toast.error(e.message || 'Falha ao declarar viés.');
  } finally {
    isDeclaringBias.value = false;
  }
}

watch(
  () => [country.value, groupSlug.value],
  () => { void loadQuiz(); },
  { immediate: true }
);

useSeoMeta({
  title: () => hostGroup.value ? `Quiz — ${hostGroup.value.name}` : 'Quiz',
});
</script>

<style scoped>
.quiz-page {
  max-width: 720px;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
}

.quiz-state {
  padding: 2rem 0;
  text-align: center;
}

.quiz-error {
  color: #c62828;
}

.quiz-header {
  margin-bottom: 1.25rem;
}

.quiz-back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.quiz-back:hover {
  color: var(--primary-color-dark);
  text-decoration: none;
}

.quiz-header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
  color: var(--primary-color-dark);
}

.quiz-subtitle {
  margin: 0;
  color: #666;
}

.quiz-card {
  padding: 1.25rem 1.35rem;
}

.quiz-question {
  margin: 0 0 1rem;
  font-size: 1.15rem;
  line-height: 1.45;
  font-weight: 600;
}

.quiz-progress {
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  color: #777;
  font-weight: 500;
}

.quiz-progress-bar {
  height: 0.35rem;
  border-radius: 999px;
  background: #e6e6e6;
  margin-bottom: 1rem;
  overflow: hidden;
}

.quiz-progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.2s ease;
}

.quiz-nav {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
</style>
