import type { Database } from '~/types/supabase';

export type AuthorGroupRank = {
  level: number;
  title: string;
  influencePoints: number;
  endorsementPower: number;
};

/**
 * Batch-load each author's bias rank within a group (for avatar frames / badges).
 */
export function useGroupAuthorRanks(groupId: MaybeRefOrGetter<string | null | undefined>) {
  const supabase = useSupabaseClient<Database>();
  const ranks = ref<Record<string, AuthorGroupRank>>({});
  const isLoading = ref(false);

  async function loadForAuthors(authorIds: Array<string | null | undefined>) {
    const gid = toValue(groupId);
    const ids = [...new Set(authorIds.filter((id): id is string => !!id))];
    if (!gid || ids.length === 0) return;

    const missing = ids.filter((id) => !ranks.value[id]);
    if (missing.length === 0) return;

    isLoading.value = true;
    try {
      const { data, error } = await supabase
        .from('biases')
        .select('user_id, level, title, influence_points, endorsement_power')
        .eq('group_id', gid)
        .in('user_id', missing);

      if (error) throw error;

      const next = { ...ranks.value };
      for (const row of data || []) {
        if (!row.user_id) continue;
        next[row.user_id] = {
          level: row.level ?? 1,
          title: row.title || 'Aspirante',
          influencePoints: row.influence_points ?? 0,
          endorsementPower: row.endorsement_power ?? 0,
        };
      }
      ranks.value = next;
    } catch (e) {
      console.error('Erro ao carregar ranks de autores no grupo:', e);
    } finally {
      isLoading.value = false;
    }
  }

  function rankFor(authorId: string | null | undefined): AuthorGroupRank | null {
    if (!authorId) return null;
    return ranks.value[authorId] || null;
  }

  function clear() {
    ranks.value = {};
  }

  return {
    ranks,
    isLoading,
    loadForAuthors,
    rankFor,
    clear,
  };
}
