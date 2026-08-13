<template>
  <div class="group-page">
    <div v-if="isLoading" class="loading-spinner container">
      <LoadingMessage message="Carregando dados do grupo..." />
    </div>
    <div v-else-if="!groupData && !isLoading" class="group-not-found container">
      <h2>Grupo não encontrado</h2>
      <p>O grupo que você está procurando não existe ou o link está incorreto.</p>
      <NuxtLink to="/categories" class="button-primary">Explorar Categorias</NuxtLink>
    </div>
    <div v-else-if="groupData" class="group-content">
      <header class="group-header">
        <div class="header-background-image" :style="headerBackgroundStyle"></div>
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
          <div class="group-flag-container">
            <img
              v-if="groupData.flag_path"
              :src="groupFlagUrl"
              :alt="`Bandeira de ${groupData.name}`"
              class="group-flag"
            />
            <div v-else class="group-flag-placeholder">
              <span>{{ groupData.name.substring(0, 1) }}</span>
            </div>
          </div>
          <div class="group-title-info">
            <h1>{{ groupData.name }}</h1>
            <p class="group-meta">
              <span class="country-with-flag">
                País:
                <img
                  v-if="groupCountryFlag"
                  :src="groupCountryFlag"
                  :alt="`Bandeira de ${formatCountryName(groupData.country_code)}`"
                  class="country-flag"
                  width="24"
                  height="18"
                  loading="lazy"
                />
                {{ groupData.country_code.toUpperCase() }}
              </span>
              <span v-if="false">| Categoria: {{ groupData?.category_group_id }}</span>
              <span class="group-access-status" :class="groupData.is_open ? 'open' : 'closed'">
                |
                <Icon
                  :name="groupData.is_open ? 'lucide:unlock' : 'lucide:lock'"
                  :size="14"
                  class="group-status-icon"
                />
                Grupo {{ groupData.is_open ? 'Aberto' : 'Restrito' }}
              </span>
            </p>
          </div>
        </div>
      </header>

      <div class="group-body container">
        <div class="main-column">
          <p v-if="groupData.description" class="group-description">
            {{ groupData.description }}
          </p>

          <div v-if="accessChecked && !canInteractWithPosts" class="access-locked card-style">
            <h3>Postagens restritas</h3>
            <p v-if="!authUserId">
              Este é um grupo fechado. Crie uma conta ou faça login para declarar o viés
              e acumular influência.
            </p>
            <div v-if="!authUserId" class="access-actions">
              <NuxtLink to="/user/register" class="button-primary">Criar conta</NuxtLink>
              <NuxtLink to="/user/login" class="button-secondary">Entrar</NuxtLink>
            </div>
            <template v-else-if="!userBiasForGroup">
              <p>
                Este é um grupo fechado. Declare este viés para começar a acumular influência
                e, com endossos suficientes, liberar as postagens.
              </p>
              <button
                type="button"
                class="button-primary"
                :disabled="isDeclaringBias"
                @click="declareBiasForCurrentGroup"
              >
                <LoadingMessage
                  v-if="isDeclaringBias"
                  message="Declarando..."
                  :icon-size="16"
                />
                <template v-else>Defender este Viés</template>
              </button>
            </template>
            <template v-else>
              <p>
                Você já defende este viés, mas tem apenas
                <strong>{{ userBiasForGroup.influence_points ?? 0 }}</strong> pontos de influência.
                É necessário acumular
                <strong>{{ MIN_INFLUENCE_TO_ENTER_GROUP }}</strong> pontos para ver e criar postagens.
              </p>
              <p class="access-hint">
                Poste na categoria raiz deste viés para que outros defensores possam endossá-lo.
              </p>
              <NuxtLink to="/categories" class="button-primary">Ir para Categorias</NuxtLink>
            </template>
          </div>

          <template v-else-if="accessChecked && canInteractWithPosts">
            <CreatePostForm
              v-if="groupData"
              :owner-id="groupData.id"
              owner-type="group"
              @post-created="handleNewPost"
              class="create-post-component"
            />
            <PostFiltersPanel
              :posts="posts"
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
        <aside class="sidebar-column">
          <section class="subgroups-sidebar card-style" v-if="subgroups.length > 0">
            <h4>Subgrupos</h4>
            <ul>
              <li v-for="subgroup in subgroups" :key="subgroup.id">
                <NuxtLink :to="`/${subgroup.country_code}/${subgroup.slug}`">{{ subgroup.name }}</NuxtLink>
              </li>
            </ul>
          </section>
          <section class="opposites-sidebar card-style" v-if="oppositeGroups.length > 0">
            <h4>Grupos Opostos</h4>
            <ul>
              <li v-for="opposite in oppositeGroups" :key="opposite.id">
                <NuxtLink :to="`/${opposite.country_code}/${opposite.slug}`">
                  <img
                    v-if="opposite.flag_path"
                    :src="`https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${opposite.flag_path}`"
                    :alt="`Bandeira de ${opposite.name}`"
                    class="opposite-flag"
                  />
                  <span>{{ opposite.name }}</span>
                </NuxtLink>
              </li>
            </ul>
          </section>
          <NuxtLink :to="`/${groupData.country_code}/${groupData.slug}/details`" class="details-link">
            Ver Detalhes do Grupo
          </NuxtLink>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bias, Group, PostWithAuthor } from '~/types/app';
import { useToast } from 'vue-toastification';
import { MIN_INFLUENCE_TO_ENTER_GROUP, countryFlagUrl, formatCountryName } from '~/utils/formatters';

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const authUserId = useAuthUserId();

const groupData = ref<Group | null>(null);
const subgroups = ref<Group[]>([]);
const oppositeGroups = ref<Pick<Group, 'id' | 'name' | 'slug' | 'country_code' | 'flag_path'>[]>([]);
const posts = ref<PostWithAuthor[]>([]);
const filteredPosts = ref<PostWithAuthor[]>([]);
const isLoading = ref(true);
const isLoadingPosts = ref(false);
const isLoadingMorePosts = ref(false);
const hasMorePosts = ref(false);
const accessChecked = ref(false);
const isDeclaringBias = ref(false);
const userBiasForGroup = ref<Pick<Bias, 'id' | 'group_id' | 'influence_points'> | null>(null);

const POSTS_PAGE_SIZE = 20;

type GroupBreadcrumb = {
  key: string;
  name: string;
  to: string | null;
};

const breadcrumbs = ref<GroupBreadcrumb[]>([]);

/** Walk parent_group_id chain (depth is typically 1–4). PK lookups only — cheap. */
async function buildBreadcrumbs(group: Group) {
  const ancestors: GroupBreadcrumb[] = [];
  let parentId = group.parent_group_id;
  let guard = 0;

  while (parentId && guard < 8) {
    guard += 1;
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, parent_group_id')
      .eq('id', parentId)
      .maybeSingle();

    if (error || !data) break;

    ancestors.unshift({
      key: data.id,
      name: data.name,
      to: `/${data.country_code}/${data.slug}`,
    });
    parentId = data.parent_group_id;
  }

  breadcrumbs.value = [
    { key: 'categories-root', name: 'Categorias', to: '/categories' },
    ...ancestors,
    { key: group.id, name: group.name, to: null },
  ];
}

const postsEmptyMessage = computed(() => {
  if (posts.value.length === 0) {
    return 'Nenhuma postagem neste grupo ainda. Seja o primeiro!';
  }
  return 'Nenhuma postagem corresponde aos filtros selecionados.';
});

const canInteractWithPosts = computed(() => {
  if (!groupData.value) return false;
  if (groupData.value.is_open) return true;
  const points = userBiasForGroup.value?.influence_points ?? 0;
  return points >= MIN_INFLUENCE_TO_ENTER_GROUP;
});

const groupFlagUrl = computed(() => {
  if (groupData.value?.flag_path) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${groupData.value.flag_path}`;
  }
  return '';
});

const groupCountryFlag = computed(() => countryFlagUrl(groupData.value?.country_code));

const headerBackgroundStyle = computed(() => {
  if (groupData.value?.cover_image_path) {
    const coverUrl = `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/covers/${groupData.value.cover_image_path}`;
    return { backgroundImage: `url('${coverUrl}')` };
  }
  return { backgroundColor: 'var(--primary-color-light)' };
});

async function resolveGroupAccess(groupId: string, isOpen: boolean) {
  accessChecked.value = false;
  userBiasForGroup.value = null;

  if (isOpen) {
    accessChecked.value = true;
    return;
  }

  if (!authUserId.value) {
    accessChecked.value = true;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('biases')
      .select('id, group_id, influence_points')
      .eq('user_id', authUserId.value)
      .eq('group_id', groupId)
      .maybeSingle();

    if (error) throw error;
    userBiasForGroup.value = data;
  } catch (e: any) {
    console.error('Erro ao verificar acesso ao grupo:', e);
    toast.error(e.message || 'Falha ao verificar permissão de acesso.');
  } finally {
    accessChecked.value = true;
  }
}

async function declareBiasForCurrentGroup() {
  if (!authUserId.value || !groupData.value || isDeclaringBias.value) return;

  isDeclaringBias.value = true;
  try {
    const { data: checkData, error: checkError } = await supabase.rpc('can_declare_bias', {
      p_user_id: authUserId.value,
      p_group_id_to_declare: groupData.value.id,
    });

    if (checkError) throw checkError;

    const result = checkData?.[0];
    if (result && !result.can_declare) {
      toast.error(result.reason || 'Não foi possível declarar este viés.');
      return;
    }

    const { data, error } = await supabase
      .from('biases')
      .insert({
        user_id: authUserId.value,
        group_id: groupData.value.id,
        influence_points: 10,
      })
      .select('id, group_id, influence_points')
      .single();

    if (error) {
      if (error.message?.includes('unique constraint') || error.code === '23505') {
        toast.info('Você já declarou este viés.');
        await resolveGroupAccess(groupData.value.id, !!groupData.value.is_open);
      } else {
        throw error;
      }
      return;
    }

    if (data) {
      userBiasForGroup.value = data;
      toast.success('Viés declarado com sucesso!');
    }
  } catch (e: any) {
    toast.error('Erro ao declarar viés: ' + e.message);
  } finally {
    isDeclaringBias.value = false;
  }
}

async function fetchOppositeGroups(groupId: string) {
  oppositeGroups.value = [];
  try {
    const { data: opps, error: oppError } = await supabase
      .from('group_oppositions')
      .select('group_id_a, group_id_b')
      .or(`group_id_a.eq.${groupId},group_id_b.eq.${groupId}`);

    if (oppError) throw oppError;

    const oppositeIds = (opps || [])
      .map((row) => (row.group_id_a === groupId ? row.group_id_b : row.group_id_a))
      .filter(Boolean);

    if (oppositeIds.length === 0) return;

    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, flag_path')
      .in('id', oppositeIds)
      .order('name', { ascending: true });

    if (groupsError) throw groupsError;
    oppositeGroups.value = groups || [];
  } catch (e: any) {
    console.error('Erro ao buscar grupos opostos:', e);
  }
}

async function fetchPostsForGroup(groupId: string, before?: string | null, append = false) {
  if (append) {
    isLoadingMorePosts.value = true;
  } else {
    isLoadingPosts.value = true;
  }
  try {
    let query = supabase
      .from('posts_with_author_info')
      .select('*')
      .eq('owner_id', groupId)
      .eq('owner_type', 'group')
      .order('created_at', { ascending: false })
      .limit(POSTS_PAGE_SIZE);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []) as PostWithAuthor[];
    if (append) {
      const existing = new Set(posts.value.map((p) => p.id));
      posts.value = [...posts.value, ...rows.filter((p) => p.id && !existing.has(p.id))];
    } else {
      posts.value = rows;
    }
    hasMorePosts.value = rows.length >= POSTS_PAGE_SIZE;
  } catch (e: any) {
    console.error('Erro ao buscar posts:', e);
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
  if (!groupData.value || isLoadingMorePosts.value || !hasMorePosts.value) return;
  const last = posts.value[posts.value.length - 1];
  if (!last?.created_at) return;
  await fetchPostsForGroup(groupData.value.id, last.created_at, true);
}

async function fetchGroupData(country: string, slug: string): Promise<void> {
  isLoading.value = true;
  accessChecked.value = false;
  groupData.value = null;
  breadcrumbs.value = [];
  subgroups.value = [];
  oppositeGroups.value = [];
  posts.value = [];
  filteredPosts.value = [];
  hasMorePosts.value = false;
  userBiasForGroup.value = null;

  if (!slug || !country) {
    toast.error('Informações do grupo incompletas para carregar a página.');
    isLoading.value = false;
    accessChecked.value = true;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id, name, slug, description, flag_path, country_code, is_open,
        category_group_id, parent_group_id, has_subgroups, cover_image_path
      `)
      .eq('slug', slug)
      .eq('country_code', country)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Grupo "${slug}" no país "${country.toUpperCase()}" não encontrado.`);
      }
      throw error;
    }

    if (data) {
      groupData.value = data as Group;

      await Promise.all([
        buildBreadcrumbs(groupData.value),
        resolveGroupAccess(groupData.value.id, !!groupData.value.is_open),
        fetchOppositeGroups(groupData.value.id),
      ]);

      if (groupData.value.has_subgroups) {
        const { data: subData, error: subError } = await supabase
          .from('groups')
          .select('id, name, slug, country_code')
          .eq('parent_group_id', groupData.value.id)
          .eq('country_code', country)
          .order('name', { ascending: true });

        if (subError) throw subError;
        if (subData) subgroups.value = subData as Group[];
      }

      if (canInteractWithPosts.value) {
        await fetchPostsForGroup(groupData.value.id);
      }
    } else {
      toast.error(`Grupo "${slug}" no país "${country.toUpperCase()}" não foi encontrado.`);
    }

  } catch (e: any) {
    console.error('Erro ao buscar dados do grupo:', e);
    toast.error(e.message || 'Falha ao carregar dados do grupo.');
    groupData.value = null;
    accessChecked.value = true;
  } finally {
    isLoading.value = false;
  }
}

function handleNewPost(newPost: PostWithAuthor) {
  posts.value.unshift(newPost);
}

function handlePostDeleted(postId: string) {
  posts.value = posts.value.filter((p) => p.id !== postId);
}

function handlePostUpdated(payload: { id: string; text_content: string | null; image_path: string | null; video_url: string | null; is_edited: boolean; updated_at: string }) {
  const index = posts.value.findIndex((p) => p.id === payload.id);
  if (index === -1) return;
  posts.value[index] = {
    ...posts.value[index],
    text_content: payload.text_content,
    image_path: payload.image_path,
    video_url: payload.video_url,
    is_edited: payload.is_edited,
    updated_at: payload.updated_at,
  };
}

watch(
  () => [route.params.country_code, route.params.slug],
  ([newCountry, newSlugArray]) => {
    if (newCountry && newSlugArray && Array.isArray(newSlugArray) && newSlugArray.length > 0) {
      const countryStr = typeof newCountry === 'string' ? newCountry : newCountry[0];
      const completeSlug = (newSlugArray as string[]).join('/');
      fetchGroupData(countryStr, completeSlug);
    }
  },
  { immediate: true, deep: true }
);

watch(authUserId, () => {
  if (groupData.value) {
    resolveGroupAccess(groupData.value.id, !!groupData.value.is_open).then(() => {
      if (canInteractWithPosts.value && posts.value.length === 0 && groupData.value) {
        fetchPostsForGroup(groupData.value.id);
      }
    });
  }
});

// Atualizar título da página
 watch(groupData, (newData) => {
  if (newData?.name) {
    useHead({
      title: `${newData.name} - TruthSeek Network`,
      meta: [{ name: 'description', content: newData.description || `Página do grupo ${newData.name}` }]
    });
  } else if (!isLoading.value && !newData) {
    useHead({
      title: `Grupo Não Encontrado - TruthSeek Network`,
    });
  }
}, { immediate: true });
</script>

<style scoped>
.breadcrumb-nav {
  position: relative;
  z-index: 2;
  margin: 0 auto;
  padding: 0.85rem 15px 0;
  font-size: 0.9rem;
  background: none;
  box-shadow: none;
  border-radius: 0;
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
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  display: inline-block;
}
.breadcrumb-nav a,
.breadcrumb-nav li span {
  color: var(--header-text);
  text-decoration: none;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}
.breadcrumb-nav a:hover {
  opacity: 0.85;
  text-decoration: none;
}
.breadcrumb-nav li span.active {
  font-weight: 500;
  opacity: 0.95;
}

.group-header {
  color: var(--header-text); /* Assumindo texto claro no header do grupo */
  position: relative;
  margin-bottom: 2rem;
}

.header-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 250px; /* Altura da imagem de capa */
  background-size: cover;
  background-position: center;
  background-color: var(--primary-color-light); /* Fallback */
  z-index: 1;
}
.header-background-image::after { /* Overlay sutil para melhor contraste do texto */
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.3); /* Ajuste a opacidade */
}

.header-content {
  position: relative;
  z-index: 2;
  padding-top: 1.25rem;
  padding-bottom: 1.5rem;
  display: flex;
  align-items: flex-end; /* Alinha flag e título na base */
  gap: 1.5rem;
  min-height: calc(250px - 2.5rem);
}

.group-flag-container {
  width: 120px; /* Tamanho da flag/avatar do grupo */
  height: 120px;
  border-radius: 8px; /* Ou 50% para redondo */
  overflow: hidden;
  border: 3px solid var(--card-bg); /* Borda para destacar da capa */
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  background-color: var(--primary-color); /* Fundo do placeholder */
  flex-shrink: 0; /* Não encolher */
}
.group-flag-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem; font-weight: bold; color: var(--header-text);
}
.group-flag {
  width: 100%; height: 100%; object-fit: cover;
}

.group-title-info {
  flex-grow: 1;
}
.group-title-info h1 {
  font-size: 2.2rem;
  margin-bottom: 0.25rem;
  color: var(--header-text); /* Garante cor do texto no header */
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5); /* Sombra para legibilidade */
}
.group-meta {
  font-size: 0.9rem;
  color: var(--header-text);
  opacity: 0.9;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.4);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}
.country-with-flag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.country-flag {
  display: inline-block;
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}
.group-access-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.group-status-icon {
  flex-shrink: 0;
}

.group-body {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: uma coluna */
  gap: 1.5rem;
}

@media (min-width: 992px) {
  .group-body {
    grid-template-columns: 2.5fr 1fr; /* Desktop: conteúdo principal e sidebar */
  }
}

.access-locked {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
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

.access-hint {
  font-size: 0.95rem;
  color: #666;
  font-style: italic;
}

.access-locked .button-primary {
  display: inline-block;
  margin-top: 0.75rem;
  border: none;
  cursor: pointer;
}

.access-locked .button-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.card-style { /* Estilo comum para cards na sidebar */
  margin-bottom: 1.5rem;
}

.group-description {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 0 0 1.5rem;
  line-height: 1.6;
  font-size: 1rem;
}

.create-post-section textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 1rem;
  font-family: inherit;
  font-size: 1rem;
}
.create-post-section button {
  display: block;
  margin-left: auto; /* Alinhar à direita */
}

.posts-list-section p, .subgroups-sidebar p, .opposites-sidebar p {
  color: #777;
  font-style: italic;
}
.subgroups-sidebar ul,
.opposites-sidebar ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.subgroups-sidebar li a,
.opposites-sidebar li a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--border-color);
}
.subgroups-sidebar li:last-child a,
.opposites-sidebar li:last-child a {
  border-bottom: none;
}
.subgroups-sidebar li a:hover,
.opposites-sidebar li a:hover {
  color: var(--primary-color-dark);
}
.opposite-flag {
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
}

.details-link {
  display: block;
  text-align: center;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  border-radius: 4px;
  font-weight: 500;
}
.details-link:hover {
  background-color: color-mix(in srgb, var(--primary-color-light) 90%, #000);
  text-decoration: none;
}


.loading-spinner {
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
}
.error-message, .group-not-found {
  text-align: center;
  padding: 3rem 1rem;
}
.error-message p, .group-not-found p { margin-bottom: 1.5rem; }
</style>
