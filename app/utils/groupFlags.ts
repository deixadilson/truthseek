export const META_GROUP_SLUG = 'truthseek';

const FLAGS_BUCKET = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags';

export function isMetaGroup(group: { slug?: string | null } | null | undefined): boolean {
  return group?.slug === META_GROUP_SLUG;
}

export function resolveGroupFlagUrl(group: {
  slug?: string | null;
  flag_path?: string | null;
} | null | undefined): string | null {
  if (!group) return null;
  if (isMetaGroup(group)) return '/images/logo.svg';
  if (!group.flag_path) return null;
  return `${FLAGS_BUCKET}/${group.flag_path}`;
}
