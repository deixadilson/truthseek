import type { Group } from '~/types/app';

export type VsGroupSide = Pick<
  Group,
  'id' | 'name' | 'slug' | 'country_code' | 'flag_path' | 'parent_group_id' | 'category_group_id' | 'is_open' | 'cover_image_path'
>;

/** Last segment of a hierarchical group slug. */
export function leafFromSlug(slug: string): string {
  const parts = slug.split('/').filter(Boolean);
  return parts[parts.length - 1] || slug;
}

/** Parent path of a hierarchical group slug (empty if root). */
export function parentSlugFromSlug(slug: string): string {
  const parts = slug.split('/').filter(Boolean);
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/');
}

/** Canonical pair key: sorted leaves joined by `-vs-`. */
export function buildVsPairKey(slugA: string, slugB: string): string {
  const leaves = [leafFromSlug(slugA), leafFromSlug(slugB)].sort((a, b) =>
    a.localeCompare(b, 'en')
  );
  return `${leaves[0]}-vs-${leaves[1]}`;
}

export function parseVsPairKey(pair: string): { leafA: string; leafB: string } | null {
  const idx = pair.indexOf('-vs-');
  if (idx <= 0 || idx + 4 >= pair.length) return null;
  const leafA = pair.slice(0, idx);
  const leafB = pair.slice(idx + 4);
  if (!leafA || !leafB || leafA.includes('/') || leafB.includes('/')) return null;
  return { leafA, leafB };
}

/**
 * Shared parent slug for two sibling groups.
 * Returns null when they do not share the same parent path.
 */
export function sharedParentSlug(slugA: string, slugB: string): string | null {
  const parentA = parentSlugFromSlug(slugA);
  const parentB = parentSlugFromSlug(slugB);
  if (!parentA || !parentB || parentA !== parentB) return null;
  return parentA;
}

/** Route to the VS arena for two opposing groups. */
export function buildVsPath(
  countryCode: string,
  groupA: Pick<Group, 'slug'>,
  groupB: Pick<Group, 'slug'>
): string | null {
  const parent = sharedParentSlug(groupA.slug, groupB.slug);
  if (!parent) return null;
  const pair = buildVsPairKey(groupA.slug, groupB.slug);
  return `/${countryCode}/${parent}/vs/${pair}`;
}

/** Stable display order: alphabetical by name (pt), then slug. */
export function orderVsSides(
  a: VsGroupSide,
  b: VsGroupSide
): { left: VsGroupSide; right: VsGroupSide } {
  const cmp = a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' });
  if (cmp < 0) return { left: a, right: b };
  if (cmp > 0) return { left: b, right: a };
  return a.slug.localeCompare(b.slug, 'en') <= 0
    ? { left: a, right: b }
    : { left: b, right: a };
}

export function vsDisplayTitle(left: Pick<Group, 'name'>, right: Pick<Group, 'name'>): string {
  return `${left.name} vs ${right.name}`;
}
