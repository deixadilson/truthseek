import type { Profile } from '~/types/app';

export const useProfile = () => {
  return useState<Profile | null>('userProfile', () => null);
};

/** User id from JWT claims (supabase module v2+ uses `sub`, not `id`). */
export const useAuthUserId = () => {
  const user = useSupabaseUser();
  return computed(() => user.value?.sub ?? null);
};
