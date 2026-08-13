import type { ProfileVisibility } from '~/types/app';

export const PROFILE_VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string; hint: string }[] = [
  {
    value: 'public',
    label: 'Todos',
    hint: 'Qualquer pessoa, inclusive visitantes sem conta.',
  },
  {
    value: 'registered',
    label: 'Usuários cadastrados',
    hint: 'Somente quem estiver logado.',
  },
  {
    value: 'followers',
    label: 'Meus seguidores',
    hint: 'Somente quem segue você.',
  },
  {
    value: 'private',
    label: 'Somente eu',
    hint: 'Ninguém mais pode abrir sua página de perfil.',
  },
];

export function parseProfileVisibility(value: string | null | undefined): ProfileVisibility {
  if (value === 'registered' || value === 'followers' || value === 'private') return value;
  return 'public';
}
