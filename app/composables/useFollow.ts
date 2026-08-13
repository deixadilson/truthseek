import type { Database } from '~/types/supabase';

export type FollowStatus = 'none' | 'following' | 'requested';

export type FollowListItem = {
  id: string;
  username: string;
  avatar_path: string | null;
  followed_at: string;
  follow_status: FollowStatus;
};

function parseFollowStatus(value: unknown): FollowStatus {
  if (value === 'following' || value === 'requested') return value;
  return 'none';
}

export function useFollow() {
  const supabase = useSupabaseClient<Database>();
  const authUserId = useAuthUserId();

  async function getFollowStatus(userId: string): Promise<FollowStatus> {
    if (!authUserId.value || !userId || authUserId.value === userId) return 'none';
    const { data, error } = await supabase.rpc('get_follow_status', {
      p_other_id: userId,
    });
    if (error) throw error;
    return parseFollowStatus(data);
  }

  /** @deprecated Prefer getFollowStatus — kept for visibility checks that need a boolean. */
  async function isFollowing(userId: string): Promise<boolean> {
    return (await getFollowStatus(userId)) === 'following';
  }

  async function requestFollow(userId: string): Promise<FollowStatus> {
    if (!authUserId.value) throw new Error('Faça login para seguir usuários.');
    if (authUserId.value === userId) throw new Error('Você não pode seguir a si mesmo.');
    const { isAuthorHidden, getBlockStatus } = useBlock();
    if (isAuthorHidden(userId) || (await getBlockStatus(userId)) !== 'none') {
      throw new Error('Não é possível seguir este usuário.');
    }
    const { data, error } = await supabase.rpc('request_follow', {
      p_target_id: userId,
    });
    if (error) throw error;
    return parseFollowStatus(data);
  }

  async function cancelFollowRequest(userId: string): Promise<void> {
    if (!authUserId.value) throw new Error('Faça login para cancelar a solicitação.');
    const { error } = await supabase.rpc('cancel_follow_request', {
      p_target_id: userId,
    });
    if (error) throw error;
  }

  async function unfollow(userId: string): Promise<void> {
    if (!authUserId.value) throw new Error('Faça login para deixar de seguir.');
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', authUserId.value)
      .eq('following_id', userId);
    if (error) throw error;
  }

  async function acceptFollowRequest(requesterId: string): Promise<void> {
    if (!authUserId.value) throw new Error('Faça login para aceitar solicitações.');
    const { error } = await supabase.rpc('accept_follow_request', {
      p_requester_id: requesterId,
    });
    if (error) throw error;
  }

  async function rejectFollowRequest(requesterId: string): Promise<void> {
    if (!authUserId.value) throw new Error('Faça login para recusar solicitações.');
    const { error } = await supabase.rpc('reject_follow_request', {
      p_requester_id: requesterId,
    });
    if (error) throw error;
  }

  /**
   * Cycle follow UI action:
   * - following → unfollow → none
   * - requested → cancel → none
   * - none → request → following | requested
   */
  async function toggleFollow(userId: string, current: FollowStatus | boolean): Promise<FollowStatus> {
    const status: FollowStatus =
      current === true ? 'following' : current === false ? 'none' : current;

    if (status === 'following') {
      await unfollow(userId);
      return 'none';
    }
    if (status === 'requested') {
      await cancelFollowRequest(userId);
      return 'none';
    }
    return requestFollow(userId);
  }

  async function listFollowers(
    userId: string,
    limit = 30,
    before?: string | null
  ): Promise<FollowListItem[]> {
    const { data, error } = await supabase.rpc('list_followers', {
      p_user_id: userId,
      p_limit: limit,
      p_before: before || undefined,
    });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      username: row.username,
      avatar_path: row.avatar_path,
      followed_at: row.followed_at,
      follow_status: parseFollowStatus(row.follow_status),
    }));
  }

  async function listFollowing(
    userId: string,
    limit = 30,
    before?: string | null
  ): Promise<FollowListItem[]> {
    const { data, error } = await supabase.rpc('list_following', {
      p_user_id: userId,
      p_limit: limit,
      p_before: before || undefined,
    });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      username: row.username,
      avatar_path: row.avatar_path,
      followed_at: row.followed_at,
      follow_status: parseFollowStatus(row.follow_status),
    }));
  }

  function followActionLabel(status: FollowStatus | null | boolean): string {
    if (status === true || status === 'following') return 'Deixar de seguir';
    if (status === 'requested') return 'Solicitado';
    return 'Seguir';
  }

  function followActionIcon(status: FollowStatus | null | boolean): string {
    if (status === true || status === 'following') return 'lucide:user-minus';
    if (status === 'requested') return 'lucide:clock';
    return 'lucide:user-plus';
  }

  function followToastMessage(next: FollowStatus): string {
    if (next === 'following') return 'Agora você segue este usuário.';
    if (next === 'requested') return 'Solicitação de seguir enviada.';
    return 'Você deixou de seguir este usuário.';
  }

  return {
    getFollowStatus,
    isFollowing,
    requestFollow,
    cancelFollowRequest,
    unfollow,
    acceptFollowRequest,
    rejectFollowRequest,
    toggleFollow,
    listFollowers,
    listFollowing,
    followActionLabel,
    followActionIcon,
    followToastMessage,
  };
}
