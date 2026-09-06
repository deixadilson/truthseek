export type InfluenceFamily = 'teal' | 'bronze' | 'silver' | 'gold' | 'diamond';

export type InfluenceTierMeta = {
  level: number;
  title: string;
  endorsementPower: number;
  family: InfluenceFamily;
  /** 1–3 within metal family; 1 for diamond */
  grade: 1 | 2 | 3;
  frameClass: string;
  badgeClass: string;
};

const TITLES = [
  '',
  'Aspirante',
  'Neófito',
  'Iniciado',
  'Seguidor',
  'Apologista',
  'Entusiasta',
  'Defensor',
  'Adepto',
  'Perito',
  'Elite',
  'Mestre',
  'Grande-Mestre',
  'Líder',
] as const;

const PE = [0, 0, 0, 1, 1, 2, 3, 4, 5, 7, 10, 12, 15, 20] as const;

function familyAndGrade(level: number): { family: InfluenceFamily; grade: 1 | 2 | 3 } {
  if (level >= 13) return { family: 'diamond', grade: 1 };
  if (level >= 10) return { family: 'gold', grade: (level - 9) as 1 | 2 | 3 };
  if (level >= 7) return { family: 'silver', grade: (level - 6) as 1 | 2 | 3 };
  if (level >= 4) return { family: 'bronze', grade: (level - 3) as 1 | 2 | 3 };
  const tealLevel = Math.max(1, Math.min(3, level));
  return { family: 'teal', grade: tealLevel as 1 | 2 | 3 };
}

/** Visual + label metadata for an influence level (1–13). */
export function getInfluenceTierMeta(
  level: number | null | undefined,
  titleOverride?: string | null
): InfluenceTierMeta | null {
  if (level == null || level < 1) return null;
  const clamped = Math.min(13, Math.max(1, Math.round(level)));
  const { family, grade } = familyAndGrade(clamped);
  const suffix = family === 'diamond' ? 'diamond' : `${family}-${grade}`;
  return {
    level: clamped,
    title: titleOverride || TITLES[clamped] || 'Aspirante',
    endorsementPower: PE[clamped] ?? 0,
    family,
    grade,
    frameClass: `inf-frame--${suffix}`,
    badgeClass: `inf-badge--${suffix}`,
  };
}

export function influenceTitleForLevel(level: number | null | undefined): string {
  return getInfluenceTierMeta(level)?.title || 'Aspirante';
}
