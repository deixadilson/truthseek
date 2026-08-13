import type { Database } from '~/types/supabase';

export function useFollow() {
  const supabase = useSupabaseClient<Database>();
  const authUserId = useAuthUserId();

  async function isFollowing(userId: string): Promise<boolean> {
    if (!authUserId.value || !userId || authUserId.value === userId) return false;
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', authUserId.value)
      .eq('following_id', userId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async function follow(userId: string): Promise<void> {
    if (!authUserId.value) throw new Error('Faça login para seguir usuários.');
    if (authUserId.value === userId) throw new Error('Você não pode seguir a si mesmo.');
    const { isAuthorHidden, getBlockStatus } = useBlock();
    if (isAuthorHidden(userId) || (await getBlockStatus(userId)) !== 'none') {
      throw new Error('Não é possível seguir este usuário.');
    }
    const { error } = await supabase.from('follows').insert({
      follower_id: authUserId.value,
      following_id: userId,
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

  async function toggleFollow(userId: string, currentlyFollowing: boolean): Promise<boolean> {
    if (currentlyFollowing) {
      await unfollow(userId);
      return false;
    }
    await follow(userId);
    return true;
  }

  return {
    isFollowing,
    follow,
    unfollow,
    toggleFollow,
  };
}
