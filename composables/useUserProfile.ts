import type { Profile } from '~/types/app'; 

export const useUserProfileState = () => {
  return useState<Profile | null>('userProfile', () => null);
};