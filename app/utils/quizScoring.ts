export type LikertStance = -2 | -1 | 0 | 1 | 2;

export const LIKERT_OPTIONS: Array<{
  value: LikertStance;
  label: string;
  colorVar: string;
}> = [
  { value: 2, label: 'Concordo totalmente', colorVar: 'var(--quiz-agree-strong)' },
  { value: 1, label: 'Concordo parcialmente', colorVar: 'var(--quiz-agree-soft)' },
  { value: 0, label: 'Não concordo nem discordo', colorVar: 'var(--quiz-neutral)' },
  { value: -1, label: 'Discordo parcialmente', colorVar: 'var(--quiz-disagree-soft)' },
  { value: -2, label: 'Discordo totalmente', colorVar: 'var(--quiz-disagree-strong)' },
];

export type QuizIdeology = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  flag_path: string | null;
  description?: string | null;
};

export type QuizChoiceOption = {
  id: string;
  group_id: string;
  label: string;
  sort_order: number;
};

export type QuizProposition = {
  id: string;
  /** Optional issue tags; empty when the proposition has no linked issues */
  issue_ids?: string[];
  statement: string;
  sort_order: number;
  /** group_id -> stance; missing or null = no defined position (likert mode) */
  stances: Record<string, number | null>;
  /** Choice-mode answers; empty in likert mode */
  options?: QuizChoiceOption[];
};

export type QuizMode = 'likert' | 'choice';

export type QuizPayload = {
  host_group_id: string;
  mode?: QuizMode;
  ideologies: QuizIdeology[];
  propositions: QuizProposition[];
};

export type IdeologyScore = {
  ideology: QuizIdeology;
  scorePercent: number;
  /** Always total quiz propositions (e.g. 47) */
  totalCount: number;
  /** Exact matches + N/A propositions (N/A always counts as agreed for this label) */
  agreedCount: number;
};

/** Weight for one answer vs ideology stance: 1, 0.5, 0, -0.5, -1 */
export function stanceWeight(userAnswer: number, ideologyStance: number): number {
  const diff = Math.abs(userAnswer - ideologyStance);
  return 1 - diff * 0.5;
}

export function scoreIdeologies(
  ideologies: QuizIdeology[],
  propositions: QuizProposition[],
  answers: Record<string, number>
): IdeologyScore[] {
  const totalCount = propositions.length;

  const results: IdeologyScore[] = ideologies.map((ideology) => {
    let sum = 0;
    let scored = 0;
    let agreed = 0;

    for (const prop of propositions) {
      const userAnswer = answers[prop.id];
      if (userAnswer === undefined || userAnswer === null) continue;

      const raw = prop.stances[ideology.id];
      // N/A: counts as agreed in the label, ignored in the % average
      if (raw === undefined || raw === null) {
        agreed += 1;
        continue;
      }

      sum += stanceWeight(userAnswer, raw);
      scored += 1;
      if (userAnswer === raw) agreed += 1;
    }

    const avg = scored > 0 ? sum / scored : 0;
    return {
      ideology,
      scorePercent: Math.round(avg * 100),
      totalCount,
      agreedCount: agreed,
    };
  });

  return results.sort((a, b) => {
    if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
    return a.ideology.name.localeCompare(b.ideology.name, 'pt-BR');
  });
}

/** Choice mode: +1 per selected option matching the group → 0..100% */
export function scoreChoiceGroups(
  ideologies: QuizIdeology[],
  propositions: QuizProposition[],
  answers: Record<string, string>
): IdeologyScore[] {
  const totalCount = propositions.length;

  const results: IdeologyScore[] = ideologies.map((ideology) => {
    let agreed = 0;

    for (const prop of propositions) {
      const chosenGroupId = answers[prop.id];
      if (!chosenGroupId) continue;
      if (chosenGroupId === ideology.id) agreed += 1;
    }

    const scorePercent =
      totalCount > 0 ? Math.round((agreed / totalCount) * 100) : 0;

    return {
      ideology,
      scorePercent,
      totalCount,
      agreedCount: agreed,
    };
  });

  return results.sort((a, b) => {
    if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
    return a.ideology.name.localeCompare(b.ideology.name, 'pt-BR');
  });
}

export function resolveQuizMode(payload: QuizPayload | null | undefined): QuizMode {
  if (payload?.mode === 'choice' || payload?.mode === 'likert') return payload.mode;
  const hasOptions = payload?.propositions?.some((p) => (p.options?.length || 0) > 0);
  return hasOptions ? 'choice' : 'likert';
}

/** Fisher–Yates shuffle; returns a new array (does not mutate input). */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}
