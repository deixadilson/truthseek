<template>
  <section class="group-members-sidebar card-style" aria-label="Membros do grupo">
    <h4 class="members-heading">Membros</h4>

    <p v-if="isLoading" class="members-status">
      <LoadingMessage message="Carregando..." :icon-size="14" />
    </p>
    <p v-else-if="members.length === 0" class="members-status empty">
      Ainda não há defensores neste viés.
    </p>
    <ul v-else class="members-list">
      <li v-for="member in members" :key="member.biasId">
        <NuxtLink
          v-if="member.username"
          :to="`/user/${member.username}`"
          class="member-link"
        >
          <span class="member-media">
            <UserAvatar
              :src="member.avatarUrl"
              :alt="member.username"
              size="md"
              :level="member.level"
              :title="member.title"
            />
          </span>
          <span class="member-meta">
            <span class="member-username">{{ member.username }}</span>
            <InfluenceBadge
              :level="member.level"
              :title="member.title"
              :influence-points="member.influencePoints"
            />
          </span>
        </NuxtLink>
        <div v-else class="member-link unknown">
          <span class="member-media">
            <UserAvatar :src="defaultAvatar" alt="" size="sm" />
          </span>
          <span class="member-meta">
            <span class="member-username">Usuário</span>
          </span>
        </div>
      </li>
    </ul>

    <p v-if="showLimitHint" class="members-limit-hint">
      Mostrando os {{ members.length }} com mais influência
    </p>

    <NuxtLink
      v-if="detailsPath"
      :to="detailsPath"
      class="members-details-link"
    >
      Ver ranking completo
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  groupId: string;
  detailsPath?: string | null;
}>();

type MemberRow = {
  biasId: string;
  userId: string;
  username: string | null;
  avatarUrl: string;
  level: number;
  title: string;
  influencePoints: number;
};

const SIDEBAR_MEMBERS_LIMIT = 12;
const defaultAvatar = '/images/default-avatar.png';
const avatarBucket =
  'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

const supabase = useSupabaseClient();
const members = ref<MemberRow[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const showLimitHint = computed(
  () => !isLoading.value && totalCount.value > members.value.length && members.value.length > 0,
);

function avatarUrlFor(path: string | null | undefined): string {
  if (!path) return defaultAvatar;
  return `${avatarBucket}/${path}`;
}

async function loadMembers(groupId: string) {
  isLoading.value = true;
  members.value = [];
  totalCount.value = 0;

  try {
    const { data: biases, error } = await supabase
      .from('biases')
      .select('id, user_id, influence_points, title, level')
      .eq('group_id', groupId)
      .order('influence_points', { ascending: false })
      .order('level', { ascending: false })
      .limit(SIDEBAR_MEMBERS_LIMIT);

    if (error) throw error;

    const rows = biases || [];
    totalCount.value = rows.length;

    if (rows.length >= SIDEBAR_MEMBERS_LIMIT) {
      const { count } = await supabase
        .from('biases')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId);
      if (typeof count === 'number') totalCount.value = count;
    }

    if (rows.length === 0) return;

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_path')
      .in('id', userIds);

    if (profileError) throw profileError;

    const byId = new Map((profiles || []).map((p) => [p.id, p]));

    members.value = rows.map((row) => {
      const profile = byId.get(row.user_id);
      return {
        biasId: row.id,
        userId: row.user_id,
        username: profile?.username ?? null,
        avatarUrl: avatarUrlFor(profile?.avatar_path),
        level: row.level ?? 1,
        title: row.title || 'Aspirante',
        influencePoints: row.influence_points ?? 0,
      };
    });
  } catch (e) {
    console.error('Erro ao carregar membros do grupo:', e);
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.groupId,
  (id) => {
    if (id) void loadMembers(id);
  },
  { immediate: true },
);
</script>

<style scoped>
.group-members-sidebar {
  margin-bottom: 1.5rem;
  padding: 1rem 1.1rem;
}

.members-heading {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.members-status {
  margin: 0;
  font-size: 0.85rem;
  color: #777;
  line-height: 1.35;
}

.members-status.empty {
  font-style: italic;
}

.members-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.member-link {
  --media-size: 40px;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.45rem 0;
  text-decoration: none;
  color: var(--link-color);
  border-bottom: 1px dotted var(--border-color);
  transition: color 0.15s;
}

.members-list li:last-child .member-link {
  border-bottom: none;
}

.member-link:hover {
  text-decoration: none;
  color: var(--primary-color-dark);
}

.member-link:hover .member-username {
  color: var(--primary-color);
}

.member-link.unknown {
  color: #888;
  cursor: default;
}

.member-media {
  flex-shrink: 0;
  width: var(--media-size);
  height: var(--media-size);
}

.member-media :deep(.user-avatar) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  box-sizing: border-box;
}

.member-meta {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0;
  height: var(--media-size);
  min-width: 0;
  flex: 1;
}

.member-username {
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.members-limit-hint {
  margin: 0.55rem 0 0;
  font-size: 0.75rem;
  color: #888;
  line-height: 1.3;
}

.members-details-link {
  display: inline-block;
  margin-top: 0.65rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--primary-color);
  text-decoration: none;
}

.members-details-link:hover {
  text-decoration: none;
  color: var(--primary-color-dark);
}

.member-meta :deep(.influence-badge) {
  max-width: 100%;
  line-height: 1.15;
}

.member-meta :deep(.influence-badge-label) {
  font-size: 0.78rem;
  line-height: 1.15;
}

.member-meta :deep(.influence-badge-shield) {
  width: 0.85rem;
  height: 0.95rem;
}
</style>
