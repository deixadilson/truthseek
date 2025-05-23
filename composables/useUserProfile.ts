import type { Profile } from '~/types/app'; 

export const useProfile = () => {
  return useState<Profile | null>('userProfile', () => null);
};