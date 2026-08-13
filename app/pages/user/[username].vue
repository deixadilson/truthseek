<template>
  <div class="public-profile-page container">
    <div v-if="isLoadingProfile" class="loading-spinner">
      <LoadingMessage message="Carregando perfil..." />
    </div>

    <div v-else-if="!profile" class="not-found card-style">
      <h2>Usuário não encontrado</h2>
      <p>Não existe um perfil com o nome “{{ routeUsername }}”.</p>
      <NuxtLink to="/categories" class="button-primary">Explorar categorias</NuxtLink>
    </div>

    <div v-else-if="isUnavailable" class="not-found card-style">
      <h2>Este perfil não está disponível</h2>
      <p>Você não pode ver este perfil.</p>
      <NuxtLink to="/categories" class="button-primary">Explorar categorias</NuxtLink>
    </div>

    <template v-else>
      <header class="profile-header card-style">
        <img
          :src="avatarUrl"
          :alt="`Avatar de ${profile.username}`"
          class="profile-avatar"
          @error="onAvatarError"
        />
        <div class="profile-header-info">
          <h1>{{ profile.username }}</h1>
          <div class="profile-meta">
            <span v-if="profile.country_code" class="meta-item country-with-flag">
              <img
                v-if="countryFlag"
                :src="countryFlag"
                :alt="`Bandeira de ${formatCountryName(profile.country_code)}`"
                class="country-flag"
                width="24"
                height="18"
                loading="lazy"
              />
              <span>{{ formatCountryName(profile.country_code) }}</span>
            </span>
            <span
              v-if="profile.country_code && profile.created_at"
              class="meta-separator"
              aria-hidden="true"
            >·</span>
            <span v-if="profile.created_at" class="meta-item">
              Membro há {{ formatMembershipDuration(profile.created_at).replace(/^há\s+/i, '') }}
            </span>
          </div>
          <div v-if="blockStatus !== 'blocking'" class="follow-stats">
            <span class="follow-stat">
              <strong>{{ followersCount }}</strong>
              {{ followersCount === 1 ? 'seguidor' : 'seguidores' }}
            </span>
            <span class="follow-stat">
              <strong>{{ followingCount }}</strong> seguindo
            </span>
          </div>
          <p v-if="blockStatus === 'blocking'" class="blocked-banner">
            Você bloqueou este usuário. Postagens e interações ficam ocultas.
          </p>
          <div class="profile-actions">
            <NuxtLink
              v-if="isOwnProfile"
              to="/user/profile"
              class="button-secondary edit-profile-link"
            >
              Editar meu perfil
            </NuxtLink>
            <button
              v-else-if="authUserId && blockStatus === 'none'"
              type="button"
              class="button-secondary edit-profile-link follow-btn"
              :disabled="isTogglingFollow || followStatus === null"
              @click="handleToggleFollow"
            >
              <LoadingMessage v-if="isTogglingFollow" message="..." :icon-size="14" />
              <template v-else>
                <Icon
                  :name="followStatus ? 'lucide:user-minus' : 'lucide:user-plus'"
                  :size="15"
                />
                <span>{{ followStatus ? 'Deixar de seguir' : 'Seguir' }}</span>
              </template>
            </button>
            <button
              v-if="authUserId && !isOwnProfile"
              type="button"
              class="button-secondary edit-profile-link block-btn"
              :class="{ danger: blockStatus !== 'blocking' }"
              :disabled="isTogglingBlock || blockStatus === null"
              @click="handleBlockClick"
            >
              <LoadingMessage v-if="isTogglingBlock" message="..." :icon-size="14" />
              <template v-else>
                <Icon name="lucide:ban" :size="15" />
                <span>{{ blockStatus === 'blocking' ? 'Desbloquear' : 'Bloquear' }}</span>
              </template>
            </button>
          </div>
        </div>
      </header>

      <div v-if="blockStatus !== 'blocking'" class="profile-body">
        <aside class="profile-sidebar">
          <section class="profile-section card-style">
            <h2>Vieses declarados</h2>
            <div v-if="isLoadingBiases" class="loading-spinner compact">
              <LoadingMessage message="Carregando vieses..." :icon-size="16" />
            </div>
            <div v-else-if="groupedBiases.length > 0">
              <div
                v-for="category in groupedBiases"
                :key="category.categoryName"
                class="bias-category-group"
              >
                <header class="category-header">
                  <span class="category-name">{{ category.categoryName }}</span>
                </header>
                <ul class="biases-list">
                  <li v-for="bias in category.biases" :key="`${bias.id}`" class="bias-item">
                    <NuxtLink
                      :to="`/${bias.group_country_code}/${bias.group_slug}`"
                      class="bias-link"
                    >
                      <div class="bias-flag-container">
                        <img
                          v-if="bias.group_flag_path"
                          :src="`https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${bias.group_flag_path}`"
                          :alt="`Bandeira de ${bias.group_name}`"
                          class="bias-flag"
                        />
                        <div v-else class="bias-flag-placeholder">
                          <span>{{ bias.group_name?.substring(0, 1) || '?' }}</span>
                        </div>
                      </div>
                      <div class="bias-text">
                        <span class="bias-name">{{ bias.group_name || 'Grupo desconhecido' }}</span>
                        <span class="bias-influence">
                          <span class="points">{{ bias.influence_points }}</span>
                          <span class="title">{{ bias.title }}</span>
                        </span>
                      </div>
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
            <p v-else class="empty-message">Nenhum viés declarado ainda.</p>
          </section>
        </aside>

        <section class="profile-main posts-section">
          <h2>Postagens</h2>
          <PostList
            :posts="posts"
            :is-loading="isLoadingPosts && posts.length === 0"
            :has-more="hasMorePosts"
            :is-loading-more="isLoadingMorePosts"
            empty-message="Nenhuma postagem pública ainda."
            @post-deleted="handlePostDeleted"
            @post-updated="handlePostUpdated"
            @load-more="loadMorePosts"
          />
        </section>
      </div>
    </template>

    <ConfirmDialog
      :open="showBlockConfirm"
      title="Bloquear usuário"
      message="Você deixa de seguir esta pessoa, não verá as postagens dela e ela não poderá interagir com você. Deseja bloquear?"
      confirm-label="Bloquear"
      busy-label="Bloqueando..."
      :busy="isTogglingBlock"
      @confirm="confirmBlock"
      @update:open="showBlockConfirm = $event"
    />
  </div>
</template>

<script setup lang="ts">
import type { BiasWithDetails, PostWithAuthor, Profile } from '~/types/app';
import type { BlockStatus } from '~/composables/useBlock';
import { countryFlagUrl, formatCountryName, formatMembershipDuration } from '~/utils/formatters';
import { parseProfileVisibility } from '~/utils/profileVisibility';
import { useToast } from 'vue-toastification';

const route = useRoute();
const supabase = useSupabaseClient();
const authUserId = useAuthUserId();
const toast = useToast();
const { isFollowing, toggleFollow } = useFollow();
const { getBlockStatus, blockUser, unblockUser } = useBlock();

const defaultAvatarUrl = '/images/default-avatar.png';
const avatarBucketPath = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

const routeUsername = computed(() => String(route.params.username || '').trim());

const profile = ref<Pick<Profile, 'id' | 'username' | 'avatar_path' | 'country_code' | 'created_at' | 'profile_visibility'> | null>(null);
const avatarUrl = ref(defaultAvatarUrl);
const isLoadingProfile = ref(true);

const userBiases = ref<BiasWithDetails[]>([]);
const isLoadingBiases = ref(false);

const posts = ref<PostWithAuthor[]>([]);
const isLoadingPosts = ref(false);
const isLoadingMorePosts = ref(false);
const hasMorePosts = ref(false);
const profileAuthor = ref<Pick<Profile, 'username' | 'avatar_path'> | null>(null);

const POSTS_PAGE_SIZE = 20;

const followStatus = ref<boolean | null>(null);
const isTogglingFollow = ref(false);
const followersCount = ref(0);
const followingCount = ref(0);
const blockStatus = ref<BlockStatus | null>(null);
const isTogglingBlock = ref(false);
const showBlockConfirm = ref(false);
const isProfileHidden = ref(false);

const isOwnProfile = computed(
  () => !!authUserId.value && !!profile.value && authUserId.value === profile.value.id
);
const isUnavailable = computed(() => blockStatus.value === 'blocked' || isProfileHidden.value);

const countryFlag = computed(() => countryFlagUrl(profile.value?.country_code));

const groupedBiases = computed(() => {
  const groups: Record<string, { categoryName: string; biases: BiasWithDetails[] }> = {};
  for (const bias of userBiases.value) {
    const categoryId = bias.category_id || 'other';
    const categoryName = bias.category_name || 'Outros vieses';
    if (!groups[categoryId]) {
      groups[categoryId] = { categoryName, biases: [] };
    }
    groups[categoryId].biases.push(bias);
  }
  return Object.values(groups);
});

useHead(() => ({
  title: profile.value
    ? `${profile.value.username} — TruthSeek Network`
    : 'Perfil — TruthSeek Network',
}));

function onAvatarError() {
  if (avatarUrl.value !== defaultAvatarUrl) {
    avatarUrl.value = defaultAvatarUrl;
  }
}

async function canViewerAccessProfile(ownerId: string, visibility: ReturnType<typeof parseProfileVisibility>) {
  if (authUserId.value === ownerId) return true;
  if (visibility === 'public') return true;
  if (visibility === 'private') return false;
  if (!authUserId.value) return false;
  if (visibility === 'registered') return true;
  return isFollowing(ownerId);
}

async function fetchProfile() {
  const username = routeUsername.value;
  profile.value = null;
  avatarUrl.value = defaultAvatarUrl;
  userBiases.value = [];
  posts.value = [];
  hasMorePosts.value = false;
  profileAuthor.value = null;
  followersCount.value = 0;
  followingCount.value = 0;
  blockStatus.value = null;
  isProfileHidden.value = false;

  if (!username) {
    isLoadingProfile.value = false;
    return;
  }

  isLoadingProfile.value = true;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_path, country_code, created_at, profile_visibility')
      .ilike('username', username)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    profile.value = data;

    if (data?.avatar_path) {
      avatarUrl.value = `${avatarBucketPath}/${data.avatar_path}`;
    }

    if (data) {
      profileAuthor.value = {
        username: data.username,
        avatar_path: data.avatar_path,
      };

      if (authUserId.value && authUserId.value !== data.id) {
        try {
          blockStatus.value = await getBlockStatus(data.id);
        } catch (e) {
          console.error('Erro ao verificar bloqueio:', e);
          blockStatus.value = 'none';
        }
      } else {
        blockStatus.value = 'none';
      }

      if (blockStatus.value === 'blocked') {
        return;
      }

      if (blockStatus.value !== 'blocking') {
        const visibility = parseProfileVisibility(data.profile_visibility);
        const canView = await canViewerAccessProfile(data.id, visibility);
        if (!canView) {
          isProfileHidden.value = true;
          return;
        }
      }

      const tasks: Promise<unknown>[] = [
        fetchBiases(data.id),
        fetchFollowCounts(data.id),
      ];
      if (blockStatus.value !== 'blocking') {
        tasks.push(fetchPosts(data.id, profileAuthor.value));
        tasks.push(refreshFollowStatus(data.id));
      } else {
        followStatus.value = false;
      }
      await Promise.all(tasks);
    }
  } catch (e) {
    console.error('Erro ao carregar perfil público:', e);
    profile.value = null;
  } finally {
    isLoadingProfile.value = false;
  }
}

async function fetchFollowCounts(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_follow_counts', {
      p_user_id: userId,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    followersCount.value = Number(row?.followers_count ?? 0);
    followingCount.value = Number(row?.following_count ?? 0);
  } catch (e) {
    console.error('Erro ao carregar contadores de follow:', e);
    followersCount.value = 0;
    followingCount.value = 0;
  }
}

async function refreshFollowStatus(userId: string) {
  followStatus.value = null;
  if (!authUserId.value || authUserId.value === userId) {
    followStatus.value = false;
    return;
  }
  try {
    followStatus.value = await isFollowing(userId);
  } catch (e) {
    console.error('Erro ao verificar follow:', e);
    followStatus.value = false;
  }
}

async function handleToggleFollow() {
  if (!profile.value || !authUserId.value || isOwnProfile.value || followStatus.value === null) return;
  if (blockStatus.value && blockStatus.value !== 'none') {
    toast.info('Não é possível seguir um usuário bloqueado.');
    return;
  }
  isTogglingFollow.value = true;
  try {
    const next = await toggleFollow(profile.value.id, followStatus.value);
    followStatus.value = next;
    followersCount.value = Math.max(0, followersCount.value + (next ? 1 : -1));
    toast.success(next ? 'Agora você segue este usuário.' : 'Você deixou de seguir este usuário.');
  } catch (e: any) {
    console.error('Erro ao alternar follow:', e);
    toast.error(e.message || 'Não foi possível atualizar o follow.');
  } finally {
    isTogglingFollow.value = false;
  }
}

function handleBlockClick() {
  if (!profile.value || !authUserId.value || isOwnProfile.value || blockStatus.value === null) return;
  if (blockStatus.value === 'blocking') {
    void confirmUnblock();
    return;
  }
  showBlockConfirm.value = true;
}

async function confirmUnblock() {
  if (!profile.value) return;
  isTogglingBlock.value = true;
  try {
    await unblockUser(profile.value.id);
    blockStatus.value = await getBlockStatus(profile.value.id);
    toast.success('Usuário desbloqueado.');
    if (blockStatus.value === 'blocked' || blockStatus.value === 'blocking') return;
    await Promise.all([
      fetchBiases(profile.value.id),
      fetchPosts(profile.value.id, profileAuthor.value || {
        username: profile.value.username,
        avatar_path: profile.value.avatar_path,
      }),
      refreshFollowStatus(profile.value.id),
      fetchFollowCounts(profile.value.id),
    ]);
  } catch (e: any) {
    console.error('Erro ao desbloquear:', e);
    toast.error(e.message || 'Não foi possível desbloquear.');
  } finally {
    isTogglingBlock.value = false;
  }
}

async function confirmBlock() {
  if (!profile.value) return;
  isTogglingBlock.value = true;
  try {
    await blockUser(profile.value.id);
    blockStatus.value = 'blocking';
    followStatus.value = false;
    posts.value = [];
    userBiases.value = [];
    hasMorePosts.value = false;
    showBlockConfirm.value = false;
    toast.success('Usuário bloqueado.');
  } catch (e: any) {
    console.error('Erro ao bloquear:', e);
    toast.error(e.message || 'Não foi possível bloquear.');
  } finally {
    isTogglingBlock.value = false;
  }
}

async function fetchBiases(userId: string) {
  isLoadingBiases.value = true;
  try {
    const { data, error } = await supabase
      .from('biases_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('influence_points', { ascending: false });

    if (error) throw error;
    userBiases.value = data || [];
  } catch (e) {
    console.error('Erro ao carregar vieses do perfil:', e);
    userBiases.value = [];
  } finally {
    isLoadingBiases.value = false;
  }
}

async function fetchPosts(
  userId: string,
  author: Pick<Profile, 'username' | 'avatar_path'>,
  before?: string | null,
  append = false
) {
  if (append) {
    isLoadingMorePosts.value = true;
  } else {
    isLoadingPosts.value = true;
  }
  try {
    let query = supabase
      .from('posts_with_author_info')
      .select('*')
      .eq('author_id', userId)
      .eq('is_anonymous', false)
      .order('created_at', { ascending: false })
      .limit(POSTS_PAGE_SIZE);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []) as PostWithAuthor[];
    const groupIds = [
      ...new Set(
        rows
          .filter((p) => p.owner_type === 'group' && p.owner_id)
          .map((p) => p.owner_id as string)
      ),
    ];

    let openGroupIds = new Set<string>();
    if (groupIds.length > 0) {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, is_open, name, slug, country_code')
        .in('id', groupIds);

      if (groupsError) throw groupsError;
      openGroupIds = new Set(
        (groupsData || []).filter((g) => g.is_open).map((g) => g.id)
      );

      const byId = new Map((groupsData || []).map((g) => [g.id, g]));
      for (const row of rows) {
        if (row.owner_type !== 'group' || !row.owner_id) continue;
        const group = byId.get(row.owner_id);
        if (!group) continue;
        row.owner_group_name = row.owner_group_name || group.name;
        row.owner_group_slug = row.owner_group_slug || group.slug;
        row.owner_group_country_code = row.owner_group_country_code || group.country_code;
      }
    }

    const visible = rows
      .filter((p) => {
        if (p.owner_type !== 'group' || !p.owner_id) return true;
        return openGroupIds.has(p.owner_id);
      })
      .map((p) => ({
        ...p,
        author_username: p.author_username || author.username,
        author_avatar_path: p.author_avatar_path || author.avatar_path,
      }));

    if (append) {
      const existing = new Set(posts.value.map((p) => p.id));
      posts.value = [...posts.value, ...visible.filter((p) => p.id && !existing.has(p.id))];
    } else {
      posts.value = visible;
    }
    hasMorePosts.value = rows.length >= POSTS_PAGE_SIZE;
  } catch (e) {
    console.error('Erro ao carregar postagens do perfil:', e);
    if (!append) {
      posts.value = [];
      hasMorePosts.value = false;
    }
  } finally {
    isLoadingPosts.value = false;
    isLoadingMorePosts.value = false;
  }
}

async function loadMorePosts() {
  if (!profile.value || !profileAuthor.value || isLoadingMorePosts.value || !hasMorePosts.value) return;
  const last = posts.value[posts.value.length - 1];
  if (!last?.created_at) return;
  await fetchPosts(profile.value.id, profileAuthor.value, last.created_at, true);
}

function handlePostDeleted(postId: string) {
  posts.value = posts.value.filter((p) => p.id !== postId);
}

function handlePostUpdated(payload: {
  id: string;
  text_content: string | null;
  image_path: string | null;
  video_url: string | null;
  is_edited: boolean;
  updated_at: string;
}) {
  const index = posts.value.findIndex((p) => p.id === payload.id);
  if (index === -1) return;
  posts.value[index] = {
    ...posts.value[index],
    ...payload,
  };
}

watch(routeUsername, () => {
  fetchProfile();
}, { immediate: true });

watch(authUserId, () => {
  if (routeUsername.value) void fetchProfile();
});
</script>

<style scoped>
.public-profile-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  max-width: 1100px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 2.5rem 1rem;
}

.loading-spinner.compact {
  padding: 1rem 0.5rem;
}

.not-found {
  text-align: center;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.not-found h2 {
  margin: 0;
  color: var(--primary-color);
}

.profile-header {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
}

.profile-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-color);
  background: #f0f0f0;
  flex-shrink: 0;
}

.profile-header-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-header-info h1 {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.25;
  color: var(--primary-color);
  word-break: break-word;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.55rem;
  margin: 0;
  color: #666;
  font-size: 0.92rem;
  line-height: 1.2;
}

.follow-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem 1.1rem;
  font-size: 0.92rem;
  color: #555;
}

.follow-stat strong {
  color: var(--text-color);
  font-weight: 700;
  margin-right: 0.2rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  line-height: 1.2;
}

.meta-separator {
  color: #999;
  line-height: 1;
}

.country-flag {
  display: block;
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.edit-profile-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  align-self: flex-start;
  margin-top: 0.15rem;
  padding: 0.45rem 0.9rem;
  font-size: 0.88rem;
  line-height: 1.2;
  text-decoration: none;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.blocked-banner {
  margin: 0.15rem 0 0;
  padding: 0.55rem 0.7rem;
  font-size: 0.88rem;
  line-height: 1.35;
  color: #7a3b00;
  background: #fff6e8;
  border: 1px solid #f0d3a8;
  border-radius: 6px;
}

.block-btn.danger {
  color: #b91c1c;
  border-color: #f0c4c4;
}

.profile-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media (min-width: 900px) {
  .profile-body {
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
    gap: 1.5rem;
  }
}

.profile-sidebar {
  min-width: 0;
}

.profile-section {
  padding: 1rem 1.1rem 1.15rem;
  margin-bottom: 0;
}

.profile-section h2,
.posts-section h2 {
  margin: 0 0 0.85rem;
  font-size: 1.15rem;
  color: var(--primary-color);
}

.posts-section {
  min-width: 0;
}

.bias-category-group {
  margin-bottom: 1rem;
}

.bias-category-group:last-child {
  margin-bottom: 0;
}

.category-header {
  padding: 0.45rem 0.65rem;
  background-color: var(--primary-color-light);
  color: var(--primary-color-dark);
  font-weight: 500;
  font-size: 0.82rem;
  border-radius: 4px 4px 0 0;
  border-bottom: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
}

.biases-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 4px 4px;
}

.bias-item {
  padding: 0.65rem;
  border-bottom: 1px solid var(--border-color);
}

.biases-list li:last-child {
  border-bottom: none;
}

.bias-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: var(--text-color);
  min-width: 0;
}

.bias-link:hover .bias-name {
  color: var(--primary-color);
}

.bias-flag-container {
  flex-shrink: 0;
}

.bias-flag,
.bias-flag-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
}

.bias-flag-placeholder {
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #888;
  font-size: 0.85rem;
}

.bias-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.bias-name {
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bias-influence {
  font-size: 0.78rem;
  line-height: 1.2;
}

.bias-influence .points {
  font-weight: bold;
  color: var(--primary-color);
  margin-right: 0.35rem;
}

.bias-influence .title {
  color: #666;
}

.empty-message {
  margin: 0;
  padding: 1rem;
  text-align: center;
  color: #777;
  font-style: italic;
  background-color: #f9f9f9;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  font-size: 0.88rem;
}

@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-meta,
  .follow-stats {
    justify-content: center;
  }

  .edit-profile-link {
    align-self: center;
  }
}
</style>
