import type { Database } from '~/types/supabase'
import type { BiasWithDetails } from '~/types/app'
import { isMetaGroupBias } from '~/utils/groupFlags'
import { fetchMemberCountsByGroupIds } from '~/utils/groupMemberCounts'
import { buildVsPath, orderVsSides, vsDisplayTitle } from '~/utils/vsGroups'

export const SIDEBAR_BIASES_LIMIT = 20
export const FAVORITES_LIMIT = 30

export type FavoriteTargetType = 'group' | 'vs_group'

export type GroupShortcutItem = {
  key: string
  targetType: FavoriteTargetType
  targetId: string
  name: string
  to: string
  flagPath: string | null
  /** Present for real groups; false = restricted (bias) group. */
  isOpen?: boolean | null
  /** Only set for restricted groups (`isOpen === false`). */
  memberCount?: number | null
}

function favoriteKey(targetType: FavoriteTargetType, targetId: string) {
  return `${targetType}:${targetId}`
}

function biasToShortcut(bias: BiasWithDetails): GroupShortcutItem | null {
  if (!bias.group_id || !bias.group_slug || !bias.group_country_code || !bias.group_name) {
    return null
  }
  if (isMetaGroupBias(bias)) return null
  return {
    key: `bias:${bias.group_id}`,
    targetType: 'group',
    targetId: bias.group_id,
    name: bias.group_name,
    to: `/${bias.group_country_code}/${bias.group_slug}`,
    flagPath: bias.group_flag_path,
  }
}

export function useGroupShortcuts() {
  const supabase = useSupabaseClient<Database>()
  const authUserId = useAuthUserId()

  const biases = useState<GroupShortcutItem[]>('group-shortcuts-biases', () => [])
  const biasesTotal = useState<number>('group-shortcuts-biases-total', () => 0)
  const favorites = useState<GroupShortcutItem[]>('group-shortcuts-favorites', () => [])
  const favoriteKeys = useState<Set<string>>('group-shortcuts-fav-keys', () => new Set())
  const isLoading = useState<boolean>('group-shortcuts-loading', () => false)
  const hasLoaded = useState<boolean>('group-shortcuts-loaded', () => false)
  const loadedForUser = useState<string | null>('group-shortcuts-user', () => null)

  function isFavorite(targetType: FavoriteTargetType, targetId: string): boolean {
    return favoriteKeys.value.has(favoriteKey(targetType, targetId))
  }

  function clear() {
    biases.value = []
    biasesTotal.value = 0
    favorites.value = []
    favoriteKeys.value = new Set()
    hasLoaded.value = false
    loadedForUser.value = null
  }

  async function resolveGroupFavorites(
    ids: string[],
  ): Promise<Map<string, GroupShortcutItem>> {
    const map = new Map<string, GroupShortcutItem>()
    if (!ids.length) return map

    const { data, error } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, flag_path, is_open')
      .in('id', ids)

    if (error) throw error

    for (const g of data || []) {
      map.set(g.id, {
        key: favoriteKey('group', g.id),
        targetType: 'group',
        targetId: g.id,
        name: g.name,
        to: `/${g.country_code}/${g.slug}`,
        flagPath: g.flag_path,
        isOpen: g.is_open,
      })
    }
    return map
  }

  async function resolveVsFavorites(
    ids: string[],
  ): Promise<Map<string, GroupShortcutItem>> {
    const map = new Map<string, GroupShortcutItem>()
    if (!ids.length) return map

    const { data: vsRows, error: vsError } = await supabase
      .from('vs_groups')
      .select('id, country_code, group_id_1, group_id_2')
      .in('id', ids)

    if (vsError) throw vsError
    if (!vsRows?.length) return map

    const groupIds = Array.from(
      new Set(vsRows.flatMap((row) => [row.group_id_1, row.group_id_2])),
    )

    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, flag_path, parent_group_id, category_group_id, is_open, cover_image_path')
      .in('id', groupIds)

    if (groupsError) throw groupsError

    const byId = new Map((groups || []).map((g) => [g.id, g]))

    for (const vs of vsRows) {
      const a = byId.get(vs.group_id_1)
      const b = byId.get(vs.group_id_2)
      if (!a || !b) continue
      const { left, right } = orderVsSides(a, b)
      const to = buildVsPath(vs.country_code, left, right)
      if (!to) continue
      map.set(vs.id, {
        key: favoriteKey('vs_group', vs.id),
        targetType: 'vs_group',
        targetId: vs.id,
        name: vsDisplayTitle(left, right),
        to,
        flagPath: null,
      })
    }
    return map
  }

  async function refresh(force = false) {
    const userId = authUserId.value
    if (!userId) {
      clear()
      return
    }

    if (
      !force
      && hasLoaded.value
      && loadedForUser.value === userId
      && !isLoading.value
    ) {
      return
    }

    isLoading.value = true
    try {
      const [biasRes, favRes] = await Promise.all([
        supabase
          .from('biases_with_details')
          .select(
            'group_id, group_name, group_slug, group_country_code, group_flag_path, influence_points, level, title, created_at',
          )
          .eq('user_id', userId)
          .order('influence_points', { ascending: false }),
        supabase
          .from('group_favorites')
          .select('target_type, target_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ])

      if (biasRes.error) throw biasRes.error
      if (favRes.error) throw favRes.error

      const allBiases = (biasRes.data || [])
        .map((row) => biasToShortcut(row as BiasWithDetails))
        .filter((item): item is GroupShortcutItem => !!item)

      const favRows = favRes.data || []
      const groupIds = favRows
        .filter((r) => r.target_type === 'group')
        .map((r) => r.target_id)
      const vsIds = favRows
        .filter((r) => r.target_type === 'vs_group')
        .map((r) => r.target_id)

      const [groupMap, vsMap] = await Promise.all([
        resolveGroupFavorites(groupIds),
        resolveVsFavorites(vsIds),
      ])

      const biasGroupIds = allBiases.map((b) => b.targetId)
      const openLookupIds = Array.from(new Set([...biasGroupIds, ...groupIds]))
      const isOpenById = new Map<string, boolean>()

      if (openLookupIds.length) {
        for (const g of groupMap.values()) {
          if (typeof g.isOpen === 'boolean') isOpenById.set(g.targetId, g.isOpen)
        }
        const missingOpenIds = openLookupIds.filter((id) => !isOpenById.has(id))
        if (missingOpenIds.length) {
          const { data: openRows, error: openError } = await supabase
            .from('groups')
            .select('id, is_open')
            .in('id', missingOpenIds)
          if (openError) throw openError
          for (const row of openRows || []) {
            isOpenById.set(row.id, row.is_open)
          }
        }
      }

      const closedIds = openLookupIds.filter((id) => isOpenById.get(id) === false)
      const memberCounts = await fetchMemberCountsByGroupIds(supabase, closedIds)

      function enrichGroupItem(item: GroupShortcutItem): GroupShortcutItem {
        if (item.targetType !== 'group') return item
        const isOpen = isOpenById.get(item.targetId) ?? item.isOpen ?? null
        return {
          ...item,
          isOpen,
          memberCount: isOpen === false ? (memberCounts[item.targetId] ?? 0) : null,
        }
      }

      const enrichedBiases = allBiases.map(enrichGroupItem)
      biasesTotal.value = enrichedBiases.length
      biases.value = enrichedBiases.slice(0, SIDEBAR_BIASES_LIMIT)

      const nextFavorites: GroupShortcutItem[] = []
      const nextKeys = new Set<string>()

      for (const row of favRows) {
        const type = row.target_type as FavoriteTargetType
        if (type !== 'group' && type !== 'vs_group') continue
        const item =
          type === 'group' ? groupMap.get(row.target_id) : vsMap.get(row.target_id)
        if (!item) continue
        const enriched = enrichGroupItem(item)
        nextFavorites.push(enriched)
        nextKeys.add(enriched.key)
      }

      favorites.value = nextFavorites
      favoriteKeys.value = nextKeys
      hasLoaded.value = true
      loadedForUser.value = userId
    } catch (e) {
      console.error('Erro ao carregar atalhos de grupos:', e)
      if (!hasLoaded.value) {
        biases.value = []
        biasesTotal.value = 0
        favorites.value = []
        favoriteKeys.value = new Set()
      }
    } finally {
      isLoading.value = false
    }
  }

  async function ensureLoaded() {
    if (!authUserId.value) {
      clear()
      return
    }
    if (loadedForUser.value !== authUserId.value || !hasLoaded.value) {
      await refresh(true)
    }
  }

  async function toggleFavorite(
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<boolean> {
    if (!authUserId.value) {
      throw new Error('Faça login para favoritar grupos.')
    }

    const key = favoriteKey(targetType, targetId)
    const currently = favoriteKeys.value.has(key)

    if (currently) {
      const { error } = await supabase
        .from('group_favorites')
        .delete()
        .eq('user_id', authUserId.value)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
      if (error) throw error

      const nextKeys = new Set(favoriteKeys.value)
      nextKeys.delete(key)
      favoriteKeys.value = nextKeys
      favorites.value = favorites.value.filter((f) => f.key !== key)
      return false
    }

    if (favorites.value.length >= FAVORITES_LIMIT) {
      throw new Error(
        `Você já tem ${FAVORITES_LIMIT} favoritos. Remova um para adicionar outro.`,
      )
    }

    const { error } = await supabase.from('group_favorites').insert({
      user_id: authUserId.value,
      target_type: targetType,
      target_id: targetId,
    })
    if (error) throw error

    await refresh(true)
    return true
  }

  return {
    biases,
    biasesTotal,
    favorites,
    isLoading,
    hasLoaded,
    isFavorite,
    refresh,
    ensureLoaded,
    toggleFavorite,
    clear,
  }
}
