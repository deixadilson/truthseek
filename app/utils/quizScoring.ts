export type LikertStance = -2 | -1 | 0 | 1 | 2;

export const LIKERT_OPTIONS: Array<{
  value: LikertStance;
  label: string;
  colorVar: string;
}> = [
  { value: 2, label: 'Concordo totalmente', colorVar: 'var(--quiz-agree-strong)' },
  { value: 1, label: 'Concordo', colorVar: 'var(--quiz-agree-soft)' },
  { value: 0, label: 'Não concordo nem discordo', colorVar: 'var(--quiz-neutral)' },
  { value: -1, label: 'Discordo', colorVar: 'var(--quiz-disagree-soft)' },
  { value: -2, label: 'Discordo totalmente', colorVar: 'var(--quiz-disagree-strong)' },
];

export type QuizIdeology = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  flag_path: string | null;
  description?: string | null;
  parent_group_id?: string | null;
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

export type QuizAxis = {
  id: string;
  name: string;
  slug: string;
  group_ids: string[];
};

export type QuizPayload = {
  host_group_id: string;
  mode?: QuizMode;
  ideologies: QuizIdeology[];
  propositions: QuizProposition[];
  /** Rival axes (parent containers). Empty/absent → flat ranking. */
  axes?: QuizAxis[];
};

export type IdeologyScore = {
  ideology: QuizIdeology;
  scorePercent: number;
  /** Always total quiz propositions (e.g. 47) */
  totalCount: number;
  /** Exact matches + N/A propositions (N/A always counts as agreed for this label) */
  agreedCount: number;
};

export type AxisScoreResult = {
  axis: QuizAxis;
  scores: IdeologyScore[];
  winner: IdeologyScore | null;
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

/** True when the quiz should show one winner per rival axis. */
export function hasMultiAxisResults(payload: QuizPayload | null | undefined): boolean {
  return (payload?.axes?.length || 0) > 1;
}

/**
 * Score each rival axis independently (only props with stances on that axis).
 * Winner = top score within the axis (name tie-break).
 */
export function scoreByAxes(
  axes: QuizAxis[],
  ideologies: QuizIdeology[],
  propositions: QuizProposition[],
  answers: Record<string, number>
): AxisScoreResult[] {
  const byId = new Map(ideologies.map((g) => [g.id, g]));

  return axes.map((axis) => {
    const axisGroups = (axis.group_ids || [])
      .map((id) => byId.get(id))
      .filter((g): g is QuizIdeology => !!g);

    const axisGroupIds = new Set(axisGroups.map((g) => g.id));
    const axisProps = propositions.filter((p) =>
      Object.entries(p.stances || {}).some(
        ([gid, stance]) => axisGroupIds.has(gid) && stance !== null && stance !== undefined
      )
    );

    const scores = scoreIdeologies(axisGroups, axisProps, answers);
    return {
      axis,
      scores,
      winner: scores[0] || null,
    };
  });
}

/** Group that “owns” the affirmation: highest defined stance (typically +2). */
export function propositionHomeGroupId(prop: QuizProposition): string | null {
  let bestId: string | null = null;
  let bestStance = -Infinity;
  for (const [gid, raw] of Object.entries(prop.stances || {})) {
    if (raw === null || raw === undefined) continue;
    const stance = Number(raw);
    if (stance > bestStance) {
      bestStance = stance;
      bestId = gid;
    }
  }
  return bestId;
}

/**
 * Shuffle propositions so consecutive items rarely share the same home group
 * (avoids showing all 3 affirmations of one school in a row).
 */
export function shufflePropositionsSpreadHomes(
  propositions: readonly QuizProposition[]
): QuizProposition[] {
  const remaining = shuffleArray(propositions);
  const out: QuizProposition[] = [];

  while (remaining.length) {
    const lastHome = out.length
      ? propositionHomeGroupId(out[out.length - 1]!)
      : null;

    const candidates = remaining
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => propositionHomeGroupId(p) !== lastHome);

    const pick = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]!
      : { p: remaining[0]!, i: 0 };

    remaining.splice(pick.i, 1);
    out.push(pick.p);
  }

  return out;
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
