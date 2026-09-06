<template>
  <div class="vs-page">
    <div v-if="isLoading" class="loading-spinner container">
      <LoadingMessage message="Carregando grupo de debate..." />
    </div>

    <div v-else-if="!vsReady" class="vs-not-found container">
      <h2>Grupo de debate não encontrado</h2>
      <p>Esta combinação de vieses não existe ou o link está incorreto.</p>
      <NuxtLink to="/categories" class="button-primary">Explorar Categorias</NuxtLink>
    </div>

    <div v-else class="vs-content">
      <header class="vs-header">
        <div class="header-backgrounds" aria-hidden="true">
          <div class="header-bg-side left" :style="leftHeaderBgStyle" />
          <div class="header-bg-side right" :style="rightHeaderBgStyle" />
        </div>

        <nav v-if="breadcrumbs.length > 0" aria-label="breadcrumb" class="breadcrumb-nav container">
          <ol>
            <li v-for="(crumb, index) in breadcrumbs" :key="crumb.key">
              <span v-if="index === breadcrumbs.length - 1" class="active">{{ crumb.name }}</span>
              <NuxtLink v-else-if="crumb.to" :to="crumb.to">{{ crumb.name }}</NuxtLink>
              <span v-else>{{ crumb.name }}</span>
            </li>
          </ol>
        </nav>

        <div class="header-content container">
          <div class="vs-side left">
            <div class="group-flag-container">
              <img
                v-if="leftFlagUrl"
                :src="leftFlagUrl"
                :alt="`Bandeira de ${leftGroup!.name}`"
                class="group-flag"
              >
              <div v-else class="group-flag-placeholder">
                <span>{{ leftGroup!.name.substring(0, 1) }}</span>
              </div>
            </div>
            <div class="vs-side-title">
              <h1>
                <NuxtLink
                  class="vs-side-name"
                  :to="`/${leftGroup!.country_code}/${leftGroup!.slug}`"
                >
                  {{ leftGroup!.name }}
                </NuxtLink>
              </h1>
              <NuxtLink
                class="vs-side-link"
                :to="`/${leftGroup!.country_code}/${leftGroup!.slug}/details`"
              >
                detalhes
              </NuxtLink>
            </div>
          </div>

          <div class="vs-divider" aria-hidden="true">
            <span class="vs-label">VS</span>
          </div>

          <div class="vs-side right">
            <div class="vs-side-title">
              <h1>
                <NuxtLink
                  class="vs-side-name"
                  :to="`/${rightGroup!.country_code}/${rightGroup!.slug}`"
                >
                  {{ rightGroup!.name }}
                </NuxtLink>
              </h1>
              <NuxtLink
                class="vs-side-link"
                :to="`/${rightGroup!.country_code}/${rightGroup!.slug}/details`"
              >
                detalhes
              </NuxtLink>
            </div>
            <div class="group-flag-container">
              <img
                v-if="rightFlagUrl"
                :src="rightFlagUrl"
                :alt="`Bandeira de ${rightGroup!.name}`"
                class="group-flag"
              >
              <div v-else class="group-flag-placeholder">
                <span>{{ rightGroup!.name.substring(0, 1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="vs-body container">
        <div
          v-if="accessChecked && !canInteractWithPosts"
          class="access-locked card-style"
        >
          <h3>Participação restrita</h3>
          <p v-if="!authUserId">
            Qualquer pessoa pode ler as postagens. Para postar ou comentar, crie uma conta
            e alcance o nível Apologista (top 50%) em um dos vieses.
          </p>
          <div v-if="!authUserId" class="access-actions">
            <NuxtLink to="/user/register" class="button-primary">Criar conta</NuxtLink>
            <NuxtLink to="/user/login" class="button-secondary">Entrar</NuxtLink>
          </div>
          <template v-else>
            <p>
              Você pode ler o debate, mas para postar ou comentar é necessário estar entre os
              <strong>50% mais influentes</strong> (Apologista ou superior) em
              <strong>{{ leftGroup!.name }}</strong>
              ou
              <strong>{{ rightGroup!.name }}</strong>.
            </p>
            <div class="access-actions">
              <NuxtLink
                :to="`/${leftGroup!.country_code}/${leftGroup!.slug}`"
                class="button-secondary"
              >
                Ir para {{ leftGroup!.name }}
              </NuxtLink>
              <NuxtLink
                :to="`/${rightGroup!.country_code}/${rightGroup!.slug}`"
                class="button-secondary"
              >
                Ir para {{ rightGroup!.name }}
              </NuxtLink>
            </div>
          </template>
        </div>

        <template v-if="accessChecked && vsGroupId">
          <CreatePostForm
            v-if="canInteractWithPosts"
            :owner-id="vsGroupId"
            owner-type="vs_group"
            :issues-group-id="issuesSourceGroupId"
            class="create-post-component"
            @post-created="handleNewPost"
          />
          <PostFiltersPanel
            :posts="posts"
            :available-issues="vsIssues"
            @update:filtered="filteredPosts = $event"
          />
          <section class="posts-list-section">
            <PostList
              :posts="filteredPosts"
              :is-loading="isLoadingPosts && posts.length === 0"
              :has-more="hasMorePosts"
              :is-loading-more="isLoadingMorePosts"
              :empty-message="postsEmptyMessage"
              :show-group-context="false"
              @post-deleted="handlePostDeleted"
              @post-updated="handlePostUpdated"
              @load-more="loadMorePosts"
            />
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bias, Group, Issue, PostWithAuthor } from '~/types/app';
import { useToast } from 'vue-toastification';
import { canEnterVsGroup } from '~/utils/formatters';
import { resolveGroupFlagUrl } from '~/utils/groupFlags';
import {
  buildVsPairKey,
  orderVsSides,
  parseVsPairKey,
  vsDisplayTitle,
  type VsGroupSide,
} from '~/utils/vsGroups';

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();
const authUserId = useAuthUserId();

type Breadcrumb = { key: string; name: string; to: string | null };
type BiasLite = Pick<Bias, 'id' | 'group_id' | 'influence_points' | 'level'>;

const POSTS_PAGE_SIZE = 20;

const isLoading = ref(true);
const leftGroup = ref<VsGroupSide | null>(null);
const rightGroup = ref<VsGroupSide | null>(null);
const breadcrumbs = ref<Breadcrumb[]>([]);
const vsGroupId = ref<string | null>(null);
const issuesSourceGroupId = ref<string | null>(null);

const posts = ref<PostWithAuthor[]>([]);
const filteredPosts = ref<PostWithAuthor[]>([]);
const vsIssues = ref<Issue[]>([]);
const isLoadingPosts = ref(false);
const isLoadingMorePosts = ref(false);
const hasMorePosts = ref(false);
const accessChecked = ref(false);
const userBiasLeft = ref<BiasLite | null>(null);
const userBiasRight = ref<BiasLite | null>(null);

const vsReady = computed(() => !!leftGroup.value && !!rightGroup.value);

const pageTitle = computed(() => {
  if (!leftGroup.value || !rightGroup.value) return 'Grupo de debate';
  return vsDisplayTitle(leftGroup.value, rightGroup.value);
});

const COVER_BUCKET = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/covers';

const leftFlagUrl = computed(() => resolveGroupFlagUrl(leftGroup.value) || '');
const rightFlagUrl = computed(() => resolveGroupFlagUrl(rightGroup.value) || '');

const { fallbackColor: leftFlagFallback } = useFlagTheme(() =>
  leftGroup.value?.cover_image_path ? null : leftFlagUrl.value
);
const { fallbackColor: rightFlagFallback } = useFlagTheme(() =>
  rightGroup.value?.cover_image_path ? null : rightFlagUrl.value
);

const canInteractWithPosts = computed(() =>
  canEnterVsGroup(userBiasLeft.value, userBiasRight.value)
);

const postsEmptyMessage = computed(() => {
  if (posts.value.length === 0) {
    return 'Nenhuma postagem neste grupo de debate ainda. Seja o primeiro!';
  }
  return 'Nenhuma postagem corresponde aos filtros selecionados.';
});

function sideHeaderBgStyle(
  coverPath: string | null | undefined,
  fallbackColor: string
): Record<string, string> {
  if (coverPath) {
    return { backgroundImage: `url('${COVER_BUCKET}/${coverPath}')` };
  }
  return { backgroundColor: fallbackColor };
}

const leftHeaderBgStyle = computed(() =>
  sideHeaderBgStyle(leftGroup.value?.cover_image_path, leftFlagFallback.value)
);
const rightHeaderBgStyle = computed(() =>
  sideHeaderBgStyle(rightGroup.value?.cover_image_path, rightFlagFallback.value)
);

async function buildBreadcrumbsToOpenGroup(
  start: Pick<Group, 'id' | 'name' | 'slug' | 'country_code' | 'parent_group_id' | 'is_open'>,
  vsTitle: string
) {
  const chain: Array<Pick<Group, 'id' | 'name' | 'slug' | 'country_code' | 'parent_group_id' | 'is_open'>> = [start];
  let parentId = start.parent_group_id;
  let guard = 0;

  while (parentId && guard < 8) {
    guard += 1;
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, parent_group_id, is_open')
      .eq('id', parentId)
      .maybeSingle();
    if (error || !data) break;
    chain.push(data);
    parentId = data.parent_group_id;
  }

  const openIdx = chain.findIndex((g) => g.is_open);
  const openGroup = openIdx >= 0 ? chain[openIdx]! : chain[chain.length - 1]!;

  const aboveOpen = chain.slice(openIdx + 1).reverse();
  breadcrumbs.value = [
    { key: 'categories-root', name: 'Categorias', to: '/categories' },
    ...aboveOpen.map((g) => ({
      key: g.id,
      name: g.name,
      to: `/${g.country_code}/${g.slug}`,
    })),
    {
      key: openGroup.id,
      name: openGroup.name,
      to: `/${openGroup.country_code}/${openGroup.slug}`,
    },
    {
      key: 'vs-current',
      name: vsTitle,
      to: null,
    },
  ];
}

async function resolveVsAccess(groupIdA: string, groupIdB: string) {
  accessChecked.value = false;
  userBiasLeft.value = null;
  userBiasRight.value = null;

  if (!authUserId.value) {
    accessChecked.value = true;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('biases')
      .select('id, group_id, influence_points, level')
      .eq('user_id', authUserId.value)
      .in('group_id', [groupIdA, groupIdB]);

    if (error) throw error;

    for (const row of data || []) {
      if (row.group_id === groupIdA) userBiasLeft.value = row;
      if (row.group_id === groupIdB) userBiasRight.value = row;
    }
  } catch (e: any) {
    console.error('Erro ao verificar acesso ao VS:', e);
    toast.error(e.message || 'Falha ao verificar permissão de acesso.');
  } finally {
    accessChecked.value = true;
  }
}

async function attachIssueIdsToPosts(rows: PostWithAuthor[]): Promise<PostWithAuthor[]> {
  const ids = rows.map((p) => p.id).filter((id): id is string => !!id);
  if (ids.length === 0) return rows.map((p) => ({ ...p, issue_ids: p.issue_ids || [] }));

  try {
    const { data, error } = await supabase
      .from('post_issues')
      .select('post_id, issue_id')
      .in('post_id', ids);

    if (error) throw error;

    const byPost = new Map<string, string[]>();
    for (const row of data || []) {
      const list = byPost.get(row.post_id) || [];
      list.push(row.issue_id);
      byPost.set(row.post_id, list);
    }

    return rows.map((post) => ({
      ...post,
      issue_ids: post.id ? (byPost.get(post.id) || []) : [],
    }));
  } catch (e) {
    console.error('Erro ao carregar issues dos posts:', e);
    return rows.map((p) => ({ ...p, issue_ids: p.issue_ids || [] }));
  }
}

async function loadVsIssues(sourceGroupId: string) {
  try {
    const { data, error } = await supabase.rpc('get_issues_for_group', {
      p_group_id: sourceGroupId,
    });
    if (error) throw error;
    vsIssues.value = (data || []) as Issue[];
  } catch (e) {
    console.error('Erro ao carregar issues do VS:', e);
    vsIssues.value = [];
  }
}

async function fetchPostsForVs(vsId: string, before?: string | null, append = false) {
  if (append) {
    isLoadingMorePosts.value = true;
  } else {
    isLoadingPosts.value = true;
  }
  try {
    let query = supabase
      .from('posts_with_author_info')
      .select('*')
      .eq('owner_id', vsId)
      .eq('owner_type', 'vs_group')
      .order('created_at', { ascending: false })
      .limit(POSTS_PAGE_SIZE);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = await attachIssueIdsToPosts((data || []) as PostWithAuthor[]);
    if (append) {
      const existing = new Set(posts.value.map((p) => p.id));
      posts.value = [...posts.value, ...rows.filter((p) => p.id && !existing.has(p.id))];
    } else {
      posts.value = rows;
    }
    hasMorePosts.value = rows.length >= POSTS_PAGE_SIZE;
  } catch (e: any) {
    console.error('Erro ao buscar posts do VS:', e);
    toast.error(e.message || 'Falha ao carregar posts.');
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
  if (!vsGroupId.value || isLoadingMorePosts.value || !hasMorePosts.value) return;
  const last = posts.value[posts.value.length - 1];
  if (!last?.created_at) return;
  await fetchPostsForVs(vsGroupId.value, last.created_at, true);
}

function handleNewPost(post: PostWithAuthor) {
  posts.value = [post, ...posts.value];
}

function handlePostDeleted(postId: string) {
  posts.value = posts.value.filter((p) => p.id !== postId);
}

function handlePostUpdated(updated: PostWithAuthor) {
  posts.value = posts.value.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
}

async function loadVsPage() {
  isLoading.value = true;
  accessChecked.value = false;
  leftGroup.value = null;
  rightGroup.value = null;
  breadcrumbs.value = [];
  vsGroupId.value = null;
  issuesSourceGroupId.value = null;
  posts.value = [];
  filteredPosts.value = [];
  vsIssues.value = [];
  hasMorePosts.value = false;
  userBiasLeft.value = null;
  userBiasRight.value = null;

  try {
    const country = String(route.params.country_code || '').toLowerCase();
    const slugParam = route.params.slug;
    const parentSlug = Array.isArray(slugParam)
      ? slugParam.join('/')
      : String(slugParam || '');
    const pair = String(route.params.pair || '');
    const parsed = parseVsPairKey(pair);

    if (!country || !parentSlug || !parsed) return;

    const canonicalPair = buildVsPairKey(
      `${parentSlug}/${parsed.leafA}`,
      `${parentSlug}/${parsed.leafB}`
    );
    if (pair !== canonicalPair) {
      await router.replace(`/${country}/${parentSlug}/vs/${canonicalPair}`);
      return;
    }

    const slugA = `${parentSlug}/${parsed.leafA}`;
    const slugB = `${parentSlug}/${parsed.leafB}`;

    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, flag_path, parent_group_id, category_group_id, is_open, cover_image_path')
      .eq('country_code', country)
      .in('slug', [slugA, slugB]);

    if (groupsError) throw groupsError;
    const gA = groups?.find((g) => g.slug === slugA) || null;
    const gB = groups?.find((g) => g.slug === slugB) || null;
    if (!gA || !gB) return;

    if (gA.parent_group_id !== gB.parent_group_id || !gA.parent_group_id) return;

    const id1 = gA.id < gB.id ? gA.id : gB.id;
    const id2 = gA.id < gB.id ? gB.id : gA.id;

    const { data: opposition, error: oppError } = await supabase
      .from('group_oppositions')
      .select('group_id_a, group_id_b')
      .eq('group_id_a', id1)
      .eq('group_id_b', id2)
      .maybeSingle();

    if (oppError) throw oppError;
    if (!opposition) return;

    const { data: ensuredId, error: ensureError } = await supabase.rpc('ensure_vs_group', {
      p_group_a: gA.id,
      p_group_b: gB.id,
    });
    if (ensureError) throw ensureError;
    vsGroupId.value = ensuredId as string;

    const ordered = orderVsSides(gA, gB);
    leftGroup.value = ordered.left;
    rightGroup.value = ordered.right;
    const title = vsDisplayTitle(ordered.left, ordered.right);

    issuesSourceGroupId.value =
      gA.parent_group_id
      || gA.category_group_id
      || gB.category_group_id
      || null;

    const { data: parent, error: parentError } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, parent_group_id, is_open')
      .eq('id', gA.parent_group_id)
      .maybeSingle();

    if (parentError) throw parentError;
    if (parent) {
      await buildBreadcrumbsToOpenGroup(parent, title);
    } else {
      breadcrumbs.value = [
        { key: 'categories-root', name: 'Categorias', to: '/categories' },
        { key: 'vs-current', name: title, to: null },
      ];
    }

    await resolveVsAccess(ordered.left.id, ordered.right.id);

    if (issuesSourceGroupId.value) {
      await loadVsIssues(issuesSourceGroupId.value);
    }

    if (vsGroupId.value) {
      await fetchPostsForVs(vsGroupId.value);
    }

    useHead({
      title: `${title} - TruthSeek Network`,
      meta: [
        {
          name: 'description',
          content: `Grupo de debate ${title} na TruthSeek Network.`,
        },
      ],
    });
  } catch (e) {
    console.error('Erro ao carregar VS group:', e);
    leftGroup.value = null;
    rightGroup.value = null;
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [route.params.country_code, route.params.slug, route.params.pair],
  () => {
    loadVsPage();
  },
  { immediate: true }
);

watch(authUserId, async () => {
  if (!leftGroup.value || !rightGroup.value || !vsGroupId.value) return;
  await resolveVsAccess(leftGroup.value.id, rightGroup.value.id);
});
</script>

<style scoped>
.vs-page,
.vs-content {
  min-width: 0;
  overflow-x: clip;
}

.breadcrumb-nav {
  position: relative;
  z-index: 2;
  margin: 0 auto;
  padding: 0.85rem 15px 0;
  font-size: 0.9rem;
}
.breadcrumb-nav ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  align-items: center;
}
.breadcrumb-nav li:not(:last-child)::after {
  content: '›';
  margin-left: 0.5rem;
  color: var(--header-text);
  opacity: 0.85;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  display: inline-block;
}
.breadcrumb-nav a,
.breadcrumb-nav li span {
  color: var(--header-text);
  text-decoration: none;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
.breadcrumb-nav a:hover {
  opacity: 0.85;
}
.breadcrumb-nav li span.active {
  font-weight: 500;
  opacity: 0.95;
}

.vs-header {
  color: var(--header-text);
  position: relative;
  margin-bottom: 2rem;
  isolation: isolate;
  overflow: hidden;
}

.header-backgrounds {
  position: absolute;
  inset: 0;
  z-index: 0;
  /* allow drop-shadow along the diagonal edge */
  overflow: visible;
}
.header-bg-side {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: var(--primary-color-light);
}
.header-bg-side::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.35);
}
.header-bg-side.left {
  /* Diagonal through header center so it bisects the VS label */
  clip-path: polygon(0 0, 54% 0, 46% 100%, 0 100%);
  filter: drop-shadow(2px 0 0 rgba(255, 255, 255, 0.55));
}
.header-bg-side.right {
  clip-path: polygon(54% 0, 100% 0, 100% 100%, 46% 100%);
}

.header-content {
  position: relative;
  z-index: 2;
  padding-top: 1.25rem;
  padding-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 210px;
  min-width: 0;
}

.vs-side {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  min-width: 0;
  flex: 1;
}
.vs-side.right {
  justify-content: flex-end;
  text-align: right;
}
.vs-side.right .vs-side-title {
  align-items: flex-end;
}

.vs-side-title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.vs-side-title h1 {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.2;
}
.vs-side-name {
  color: var(--header-text);
  text-decoration: none;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  overflow-wrap: anywhere;
  word-break: break-word;
  transition: color 0.15s ease, opacity 0.15s ease;
}
.vs-side-name:hover {
  color: var(--primary-color-light);
  opacity: 1;
  text-decoration: none;
}
.vs-side-link {
  color: var(--header-text);
  opacity: 0.85;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s ease, opacity 0.15s ease;
}
.vs-side-link:hover {
  opacity: 1;
  color: var(--primary-color-light);
  text-decoration: none;
}

.vs-divider {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 3;
  min-width: 3rem;
}
.vs-label {
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.45);
}

.group-flag-container {
  width: 110px;
  height: 110px;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid var(--card-bg);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  background-color: var(--primary-color);
  flex-shrink: 0;
}
.group-flag-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--header-text);
}
.group-flag {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vs-body {
  margin-bottom: 2rem;
  min-width: 0;
}

.access-locked {
  margin-bottom: 1.5rem;
}
.access-locked h3 {
  margin-top: 0;
  color: var(--primary-color);
}
.access-locked p {
  margin: 0.75rem 0;
  line-height: 1.5;
  color: #444;
}
.access-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.access-actions .button-primary,
.access-actions .button-secondary {
  display: inline-block;
  text-decoration: none;
}

.create-post-component {
  margin-bottom: 1rem;
}

.loading-spinner,
.vs-not-found {
  padding: 3rem 1rem;
  text-align: center;
}
.vs-not-found h2 {
  color: var(--primary-color);
}
.vs-not-found .button-primary {
  display: inline-block;
  margin-top: 1rem;
}

@media (max-width: 720px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    min-height: auto;
    padding-bottom: 1.25rem;
  }
  .header-bg-side.left {
    clip-path: polygon(0 0, 52% 0, 48% 100%, 0 100%);
  }
  .header-bg-side.right {
    clip-path: polygon(52% 0, 100% 0, 100% 100%, 48% 100%);
  }
  .vs-side {
    justify-content: flex-start;
  }
  .vs-side.right {
    flex-direction: row-reverse;
    text-align: left;
  }
  .vs-side.right .vs-side-title {
    align-items: flex-start;
  }
  .vs-divider {
    justify-content: center;
    padding: 0.15rem 0;
  }
  .vs-side-title h1 {
    font-size: 1.35rem;
  }
  .group-flag-container {
    width: 84px;
    height: 84px;
  }
}
</style>
