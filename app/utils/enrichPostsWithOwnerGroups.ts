import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostWithAuthor } from '~/types/app';
import type { Database } from '~/types/supabase';

type GroupRow = Pick<
  Database['public']['Tables']['groups']['Row'],
  'id' | 'name' | 'slug' | 'country_code'
>;

/** Ensures posts have owner group name/slug/country for “postou em …” outside group pages. */
export async function enrichPostsWithOwnerGroups(
  supabase: SupabaseClient<Database>,
  posts: PostWithAuthor[]
): Promise<PostWithAuthor[]> {
  const groupIds = [
    ...new Set(
      posts
        .filter((p) => p.owner_type === 'group' && !!p.owner_id)
        .map((p) => p.owner_id as string)
    ),
  ];
  if (groupIds.length === 0) return posts;

  const { data, error } = await supabase
    .from('groups')
    .select('id, name, slug, country_code')
    .in('id', groupIds);

  if (error) {
    console.error('Erro ao enriquecer posts com grupos:', error);
    return posts;
  }

  const byId = new Map<string, GroupRow>((data || []).map((g) => [g.id, g]));

  return posts.map((post) => {
    if (post.owner_type !== 'group' || !post.owner_id) return post;
    const group = byId.get(post.owner_id);
    if (!group) return post;
    return {
      ...post,
      owner_group_name: post.owner_group_name || group.name,
      owner_group_slug: post.owner_group_slug || group.slug,
      owner_group_country_code: post.owner_group_country_code || group.country_code,
    };
  });
}
