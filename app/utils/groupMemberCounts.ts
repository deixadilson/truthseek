import type { SupabaseClient } from '@supabase/supabase-js'

const AVATAR_BUCKET =
  'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars'
const DEFAULT_AVATAR = '/images/default-avatar.png'

export type GroupMemberAvatarPreview = {
  url: string
  username: string | null
}

export type GroupMemberPreview = {
  memberCount: number
  avatars: GroupMemberAvatarPreview[]
}

function avatarUrlFor(path: string | null | undefined): string {
  if (!path) return DEFAULT_AVATAR
  return `${AVATAR_BUCKET}/${path}`
}

/** Exact bias (member) counts keyed by group_id. */
export async function fetchMemberCountsByGroupIds(
  supabase: SupabaseClient<any>,
  groupIds: string[],
): Promise<Record<string, number>> {
  const unique = Array.from(new Set(groupIds.filter(Boolean)))
  const counts: Record<string, number> = {}
  for (const id of unique) counts[id] = 0
  if (!unique.length) return counts

  await Promise.all(
    unique.map(async (id) => {
      const { count, error } = await supabase
        .from('biases')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', id)
      if (!error && typeof count === 'number') counts[id] = count
    }),
  )

  return counts
}

/**
 * Member count + up to `avatarLimit` top-influence avatars per group.
 * Intended for restricted-group cards in category grid.
 */
export async function fetchGroupMemberPreviews(
  supabase: SupabaseClient<any>,
  groupIds: string[],
  avatarLimit = 3,
): Promise<Record<string, GroupMemberPreview>> {
  const unique = Array.from(new Set(groupIds.filter(Boolean)))
  const result: Record<string, GroupMemberPreview> = {}
  for (const id of unique) {
    result[id] = { memberCount: 0, avatars: [] }
  }
  if (!unique.length) return result

  const perGroup = await Promise.all(
    unique.map(async (id) => {
      const [topRes, countRes] = await Promise.all([
        supabase
          .from('biases')
          .select('user_id')
          .eq('group_id', id)
          .order('influence_points', { ascending: false })
          .order('level', { ascending: false })
          .limit(avatarLimit),
        supabase
          .from('biases')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', id),
      ])
      return {
        id,
        userIds: (topRes.data || []).map((row) => row.user_id as string),
        count: typeof countRes.count === 'number' ? countRes.count : 0,
      }
    }),
  )

  const allUserIds = Array.from(new Set(perGroup.flatMap((g) => g.userIds)))
  const profilesById = new Map<
    string,
    { username: string | null; avatar_path: string | null }
  >()

  if (allUserIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_path')
      .in('id', allUserIds)
    for (const profile of profiles || []) {
      profilesById.set(profile.id, {
        username: profile.username ?? null,
        avatar_path: profile.avatar_path ?? null,
      })
    }
  }

  for (const group of perGroup) {
    result[group.id] = {
      memberCount: group.count,
      avatars: group.userIds.map((userId) => {
        const profile = profilesById.get(userId)
        return {
          url: avatarUrlFor(profile?.avatar_path),
          username: profile?.username ?? null,
        }
      }),
    }
  }

  return result
}


/**
 * Meta-group (e.g. TruthSeek BR): members = all profiles of that country.
 * One count + a few recent avatars — no bias joins.
 */
export async function fetchCountryMemberPreview(
  supabase: SupabaseClient<any>,
  countryCode: string,
  avatarLimit = 3,
): Promise<GroupMemberPreview> {
  const code = (countryCode || '').toLowerCase()
  if (!code) return { memberCount: 0, avatars: [] }

  const [countRes, avatarsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('country_code', code),
    supabase
      .from('profiles')
      .select('username, avatar_path')
      .eq('country_code', code)
      .order('created_at', { ascending: false })
      .limit(avatarLimit),
  ])

  return {
    memberCount: typeof countRes.count === 'number' ? countRes.count : 0,
    avatars: (avatarsRes.data || []).map((profile) => ({
      url: avatarUrlFor(profile.avatar_path),
      username: profile.username ?? null,
    })),
  }
}

export function formatMemberCountLabel(count: number): string {
  return count === 1 ? '1 membro' : `${count} membros`
}
