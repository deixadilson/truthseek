import type { Database } from '~/types/supabase';

export type BlockStatus = 'none' | 'blocking' | 'blocked';

export type BlockedUser = {
  id: string;
  username: string;
  avatar_path: string | null;
  created_at: string;
};

export function useBlock() {
  const supabase = useSupabaseClient<Database>();
  const authUserId = useAuthUserId();

  const blockedIds = useState<string[]>('blocked-user-ids', () => []);

  const blockedSet = computed(() => new Set(blockedIds.value));

  function isAuthorHidden(authorId: string | null | undefined): boolean {
    if (!authorId) return false;
    return blockedSet.value.has(authorId);
  }

  async function refreshBlockedIds() {
    if (!authUserId.value) {
      blockedIds.value = [];
      return;
    }
    try {
      const { data, error } = await supabase.rpc('blocked_pair_ids');
      if (error) throw error;
      blockedIds.value = data || [];
    } catch (e) {
      console.error('Erro ao carregar usuários bloqueados:', e);
      blockedIds.value = [];
    }
  }

  async function getBlockStatus(userId: string): Promise<BlockStatus> {
    if (!authUserId.value || !userId || authUserId.value === userId) return 'none';
    const { data, error } = await supabase.rpc('get_block_status', {
      p_other_id: userId,
    });
    if (error) throw error;
    if (data === 'blocking' || data === 'blocked') return data;
    return 'none';
  }

  async function blockUser(userId: string) {
    if (!authUserId.value) throw new Error('Faça login para bloquear usuários.');
    if (authUserId.value === userId) throw new Error('Você não pode bloquear a si mesmo.');
    const { error } = await supabase.rpc('block_user', { p_blocked_id: userId });
    if (error) throw error;
    if (!blockedIds.value.includes(userId)) {
      blockedIds.value = [...blockedIds.value, userId];
    }
  }

  async function unblockUser(userId: string) {
    if (!authUserId.value) throw new Error('Faça login para desbloquear usuários.');
    const { error } = await supabase.rpc('unblock_user', { p_blocked_id: userId });
    if (error) throw error;
    await refreshBlockedIds();
  }

  async function listBlockedUsers(): Promise<BlockedUser[]> {
    if (!authUserId.value) return [];
    const { data, error } = await supabase
      .from('blocks')
      .select('blocked_id, created_at, profile:profiles!blocks_blocked_id_fkey(username, avatar_path)')
      .eq('blocker_id', authUserId.value)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).flatMap((row) => {
      const profile = row.profile as { username: string; avatar_path: string | null } | null;
      if (!row.blocked_id || !profile?.username) return [];
      return [{
        id: row.blocked_id,
        username: profile.username,
        avatar_path: profile.avatar_path,
        created_at: row.created_at,
      }];
    });
  }

  return {
    blockedIds,
    blockedSet,
    isAuthorHidden,
    refreshBlockedIds,
    getBlockStatus,
    blockUser,
    unblockUser,
    listBlockedUsers,
  };
}
