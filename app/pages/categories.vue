<template>
  <div class="categories-page container">
    <nav aria-label="breadcrumb" class="breadcrumb-nav" v-if="!isSearching && breadcrumbs.length > 0">
      <ol>
        <li><NuxtLink to="#" @click.prevent="navigateToCrumb(null)">Categorias</NuxtLink></li>
        <li v-for="(crumb, index) in breadcrumbs" :key="crumb.groupId || 'root-crumb'">
          <span v-if="index === breadcrumbs.length - 1" class="active">{{ crumb.name }}</span>
          <NuxtLink v-else :to="`#${crumb.groupId}`" @click.prevent="navigateToCrumb(crumb)">{{ crumb.name }}</NuxtLink>
        </li>
      </ol>
    </nav>

    <div class="page-header">
      <h1 v-if="isSearching">Resultados da Busca por "{{ searchTerm }}"</h1>
      <h1 v-else-if="breadcrumbs.length === 0">Explorar Categorias Raiz</h1>
      <h1 v-else>Subgrupos de {{ breadcrumbs[breadcrumbs.length - 1].name }}</h1>
      <div class="search-bar">
        <input type="search" v-model="searchTerm" placeholder="Buscar grupos pelo nome..." />
      </div>
    </div>

    <div v-if="isLoading" class="loading-spinner">
      <LoadingMessage message="Carregando..." />
    </div>
    <div v-else-if="errorLoading" class="error-message">{{ errorLoading }}</div>

    <template v-else>
      <div
        v-if="currentQuizHost && !isSearching && groupsToRender.length > 0"
        class="quiz-cta card-style"
      >
        <div class="quiz-cta-text">
          <h3>Não sabe qual ideologia defender?</h3>
          <p>Faça o quiz e veja com quais vieses suas posições mais se alinham.</p>
        </div>
        <NuxtLink
          :to="`/${currentQuizHost.country_code}/${currentQuizHost.slug}/quiz`"
          class="button-primary"
        >
          Fazer o quiz
        </NuxtLink>
      </div>

      <template v-if="isRootListing && (thematicRootGroups.length > 0 || platformRootGroups.length > 0)">
        <section v-if="thematicRootGroups.length > 0" class="category-section">
          <h2 class="section-title">Categorias de discussão</h2>
          <div class="categories-grid">
            <CategoryGroupCard
              v-for="group in thematicRootGroups"
              :key="group.id"
              :group="group"
              :clickable="!!group.has_subgroups"
              :bias-declared="isBiasDeclared(group.id)"
              :declaring="isDeclaringBiasFor === group.id"
              @select="handleCardClick(group)"
              @declare-bias="openDeclareBiasDialog(group)"
            />
          </div>
        </section>
        <section v-if="platformRootGroups.length > 0" class="category-section">
          <h2 class="section-title">Metagrupo da própria plataforma</h2>
          <div class="categories-grid">
            <CategoryGroupCard
              v-for="group in platformRootGroups"
              :key="group.id"
              :group="group"
              :clickable="false"
              :bias-declared="isBiasDeclared(group.id)"
              :declaring="isDeclaringBiasFor === group.id"
              @select="handleCardClick(group)"
              @declare-bias="openDeclareBiasDialog(group)"
            />
          </div>
        </section>
      </template>
      <div v-else-if="groupsToRender.length > 0" class="categories-grid">
        <CategoryGroupCard
          v-for="group in groupsToRender"
          :key="group.id"
          :group="group"
          :clickable="!isSearching && !!group.has_subgroups"
          :bias-declared="isBiasDeclared(group.id)"
          :declaring="isDeclaringBiasFor === group.id"
          @select="handleCardClick(group)"
          @declare-bias="openDeclareBiasDialog(group)"
        />
      </div>
      <div v-else class="no-categories">
        <p v-if="isSearching && searchTerm">Nenhum grupo encontrado para "{{ searchTerm }}".</p>
        <p v-else-if="!isSearching && breadcrumbs.length > 0">Nenhum subgrupo encontrado nesta categoria.</p>
        <p v-else-if="!isSearching && breadcrumbs.length === 0">Nenhuma categoria raiz encontrada.</p>
        <button v-if="!isSearching && breadcrumbs.length > 0" @click="goBackInBreadcrumb" class="button-secondary">
          Voltar
        </button>
      </div>
    </template>

    <DeclareBiasPremisesDialog
      :open="declareBiasDialogOpen"
      :group-id="pendingDeclareGroupId"
      :group-name="pendingDeclareGroupName"
      :busy="!!isDeclaringBiasFor"
      @close="closeDeclareBiasDialog"
      @confirm="confirmDeclareBias"
    />
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { Group, Bias } from '~/types/app';
import { useToast } from 'vue-toastification';
import { META_GROUP_SLUG } from '~/utils/groupFlags';

interface BreadcrumbItem {
  name: string;
  groupId: string | null;
}

const supabase = useSupabaseClient<Database>();
const authUserId = useAuthUserId();
const toast = useToast();

const allFetchedGroups = ref<Record<string, Group[]>>({});
const displayedGroups = ref<Group[]>([]);
const isLoading = ref(true);
const errorLoading = ref<string | null>(null);

const searchTerm = ref('');
const searchResults = ref<Group[]>([]);
const isSearching = ref(false);

const breadcrumbs = ref<BreadcrumbItem[]>([]);

const userBiases = ref<Bias[]>([]);
const isDeclaringBiasFor = ref<string | null>(null);
const declareBiasDialogOpen = ref(false);
const pendingDeclareGroupId = ref<string | null>(null);
const pendingDeclareGroupName = ref<string | null>(null);
const quizHostIds = ref<Set<string>>(new Set());
const quizHostsById = ref<Record<string, Pick<Group, 'id' | 'name' | 'slug' | 'country_code'>>>({});

const groupsToRender = computed(() => {
  return isSearching.value ? searchResults.value : displayedGroups.value;
});

const isRootListing = computed(() => {
  return !isSearching.value && breadcrumbs.value.length === 0;
});

const thematicRootGroups = computed(() => {
  return displayedGroups.value.filter((group) => group.slug !== META_GROUP_SLUG);
});

const platformRootGroups = computed(() => {
  return displayedGroups.value.filter((group) => group.slug === META_GROUP_SLUG);
});

const currentQuizHost = computed(() => {
  if (isSearching.value) return null;
  const last = breadcrumbs.value[breadcrumbs.value.length - 1];
  if (!last?.groupId) return null;
  if (!quizHostIds.value.has(last.groupId)) return null;
  return quizHostsById.value[last.groupId] || null;
});

async function rememberQuizHost(group: Pick<Group, 'id' | 'name' | 'slug' | 'country_code'>) {
  quizHostIds.value = new Set([...quizHostIds.value, group.id]);
  quizHostsById.value = {
    ...quizHostsById.value,
    [group.id]: {
      id: group.id,
      name: group.name,
      slug: group.slug,
      country_code: group.country_code,
    },
  };
}

async function refreshQuizAvailability(groups: Group[]) {
  const candidates = groups.filter((g) => g.has_subgroups);
  await Promise.all(
    candidates.map(async (g) => {
      try {
        const { data, error } = await supabase.rpc('host_group_has_quiz', {
          p_host_group_id: g.id,
        });
        if (error) throw error;
        if (data) await rememberQuizHost(g);
      } catch (e) {
        console.error('Erro ao verificar quiz:', e);
      }
    })
  );
}

async function ensureParentQuizHost(parentId: string | null) {
  if (!parentId) return;
  if (quizHostsById.value[parentId] && quizHostIds.value.has(parentId)) return;

  try {
    const { data: hasQuiz, error } = await supabase.rpc('host_group_has_quiz', {
      p_host_group_id: parentId,
    });
    if (error) throw error;
    if (!hasQuiz) return;

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, slug, country_code')
      .eq('id', parentId)
      .maybeSingle();
    if (groupError) throw groupError;
    if (group) await rememberQuizHost(group);
  } catch (e) {
    console.error('Erro ao verificar quiz do grupo pai:', e);
  }
}

async function fetchUserBiases() {
  if (!authUserId.value) {
    userBiases.value = [];
    return;
  }  
  try {
    const { data, error } = await supabase
      .from('biases')
      .select('id, user_id, group_id, influence_points, created_at')
      .eq('user_id', authUserId.value);
    if (error) throw error;
    userBiases.value = data || [];
  } catch (e: any) {
    console.error("Erro ao buscar vieses do usuário:", e.message);
  }
}

function isBiasDeclared(groupId: string): boolean {
  return userBiases.value.some(bias => bias.group_id === groupId);
}

async function openDeclareBiasDialog(group: Group) {
  if (!authUserId.value) {
    toast.info('É necessário criar uma conta para defender um viés. Cadastre-se ou faça login.');
    await navigateTo('/user/register');
    return;
  }

  pendingDeclareGroupId.value = group.id;
  pendingDeclareGroupName.value = group.name;
  declareBiasDialogOpen.value = true;
}

function closeDeclareBiasDialog() {
  if (isDeclaringBiasFor.value) return;
  declareBiasDialogOpen.value = false;
  pendingDeclareGroupId.value = null;
  pendingDeclareGroupName.value = null;
}

async function confirmDeclareBias() {
  const groupId = pendingDeclareGroupId.value;
  if (!authUserId.value || !groupId || isDeclaringBiasFor.value) return;

  isDeclaringBiasFor.value = groupId;

  try {
    const { data: checkData, error: checkError } = await supabase.rpc('can_declare_bias', {
      p_user_id: authUserId.value,
      p_group_id_to_declare: groupId,
    });

    if (checkError) throw checkError;

    const result = checkData?.[0];

    if (result && !result.can_declare) {
      toast.error(result.reason || "Não foi possível declarar este viés.");
      return;
    }

    const { data, error } = await supabase
      .from('biases')
      .insert({ user_id: authUserId.value, group_id: groupId, influence_points: 10 })
      .select('id, group_id, influence_points, created_at, user_id')
      .single();

    if (error) {
      if (error.message?.includes('unique constraint') || error.code === '23505') {
        toast.info('Você já declarou este viés.');
        if (!isBiasDeclared(groupId)) fetchUserBiases();
      } else {
        throw error;
      }
    } else if (data) {
      toast.success('Viés declarado com sucesso!');
      userBiases.value.push(data as Bias);
      declareBiasDialogOpen.value = false;
      pendingDeclareGroupId.value = null;
      pendingDeclareGroupName.value = null;
    }
  } catch (e: any) {
    toast.error("Erro ao declarar viés: " + e.message);
  } finally {
    isDeclaringBiasFor.value = null;
  }
}

async function fetchAndDisplayGroups(parentId: string | null, parentName?: string) {
  isLoading.value = true;
  errorLoading.value = null;
  const cacheKey = parentId || 'root';

  if (parentId && parentName) {
    const existingCrumbIndex = breadcrumbs.value.findIndex(b => b.groupId === parentId);
    if (existingCrumbIndex !== -1) {
      breadcrumbs.value.splice(existingCrumbIndex + 1);
    } else {
      breadcrumbs.value.push({ name: parentName, groupId: parentId });
    }
  } else {
    breadcrumbs.value = [];
  }

  if (allFetchedGroups.value[cacheKey]) {
    displayedGroups.value = allFetchedGroups.value[cacheKey];
    void ensureParentQuizHost(parentId);
    void refreshQuizAvailability(displayedGroups.value);
    isLoading.value = false;
    return;
  }

  try {
    let query = supabase
      .from('groups')
      .select('id, name, description, slug, flag_path, country_code, level, is_open, parent_group_id, has_subgroups')
      .eq('country_code', 'br')
      .eq('hidden', false);
    if (parentId) {
      query = query.eq('parent_group_id', parentId);
    } else {
      query = query.is('parent_group_id', null);
    }
    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    const groups = data as Group[] || [];
    allFetchedGroups.value[cacheKey] = groups;
    displayedGroups.value = groups;
    await ensureParentQuizHost(parentId);
    void refreshQuizAvailability(groups);

  } catch (e: any) {
    console.error('Erro ao buscar grupos:', e);
    errorLoading.value = e.message || 'Falha ao carregar dados.';
  } finally {
    isLoading.value = false;
  }
}

async function searchGroupsByName() {
  if (!searchTerm.value.trim()) {
    resetSearch();
    return;
  }
  isSearching.value = true;
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, description, slug, flag_path, country_code, level, is_open, parent_group_id, has_subgroups')
      .ilike('name', `%${searchTerm.value.trim()}%`)
      .eq('country_code', 'br')
      .order('name', { ascending: true });

    if (error) throw error;
    searchResults.value = data as Group[] || [];
    void refreshQuizAvailability(searchResults.value);
  } catch (e: any) {
    console.error('Erro ao buscar grupos:', e);
    toast.error(e.message || 'Falha ao realizar a busca.');
    searchResults.value = [];
  } finally {
    isLoading.value = false;
  }
}

function resetSearch() {
    isSearching.value = false;
    searchResults.value = [];
    searchTerm.value = '';
    const lastCrumb = breadcrumbs.value.length > 0 ? breadcrumbs.value[breadcrumbs.value.length - 1] : null;
    fetchAndDisplayGroups(lastCrumb?.groupId || null, lastCrumb?.name);
}

function handleCardClick(group: Group) {
  if (isSearching.value) return;
  if (group.has_subgroups) fetchAndDisplayGroups(group.id, group.name);
}

function navigateToCrumb(crumb: BreadcrumbItem | null) {
  if (crumb) {
    fetchAndDisplayGroups(crumb.groupId, crumb.name);
  } else {
    fetchAndDisplayGroups(null);
  }
}

function goBackInBreadcrumb() {
  if (breadcrumbs.value.length > 0) {
    const parentOfCurrent = breadcrumbs.value.length > 1 ? breadcrumbs.value[breadcrumbs.value.length - 2] : null;
    navigateToCrumb(parentOfCurrent);
  }
}

const filteredGroups = computed(() => {
  if (!searchTerm.value.trim()) {
    return displayedGroups.value;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  return displayedGroups.value.filter(group =>
    group.name.toLowerCase().includes(lowerSearchTerm)
  );
});

onMounted(() => {
  fetchUserBiases();
  fetchAndDisplayGroups(null);
});

let searchDebounceTimer: NodeJS.Timeout;
watch(searchTerm, (newValue) => {
  clearTimeout(searchDebounceTimer);
  if (newValue.trim() !== '') {
    searchDebounceTimer = setTimeout(() => {
      searchGroupsByName();
    }, 500);
  } else {
    resetSearch();
  }
});

watch(breadcrumbs, (newCrumbs) => {
  let title = 'Categorias';
  if (newCrumbs.length > 0) {
    title = `Subgrupos de ${newCrumbs[newCrumbs.length - 1].name}`;
  }
  useHead({
    title: `${title} - TruthSeek Network`,
    meta: [
      { name: 'description', content: `Explore ${title.toLowerCase()} na TruthSeek Network.` }
    ]
  });
}, { deep: true, immediate: true });
</script>

<style scoped>
.categories-page {
  padding-top: 1rem;
  padding-bottom: 3rem;
}

.breadcrumb-nav {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  background-color: var(--card-bg);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.breadcrumb-nav ol {
  list-style: none; padding: 0; margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  align-items: center;
}
.breadcrumb-nav li:not(:last-child)::after {
  content: '›';
  margin-left: 0.5rem;
  color: #888;
  display: inline-block;
}
.breadcrumb-nav a { color: var(--primary-color); text-decoration: none; }
.breadcrumb-nav a:hover { color: var(--primary-color-hover); opacity: 0.9; }
.breadcrumb-nav li span.active { color: var(--text-color); font-weight: 500; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-header h1 {
  color: var(--primary-color);
  margin-bottom: 0;
  text-align: left;
  flex-grow: 1;
  font-size: 2rem;
}

.quiz-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
  margin-bottom: 1.25rem;
}

.quiz-cta h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  color: var(--primary-color-dark);
}

.quiz-cta p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.quiz-cta .button-primary {
  flex: 0 0 auto;
}

.category-section {
  margin-bottom: 2.25rem;
}

.section-title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color-dark);
}

.search-bar {
  flex-basis: 300px;
  max-width: 100%;
}
.search-bar input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.95rem;
}
.search-bar input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.75rem;
}

.category-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.07);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  isolation: isolate;
}
.category-card.clickable { cursor: pointer; }
.category-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
}

.card-image-container {
  width: 100%;
  height: 200px;
  background-color: var(--primary-color-light);
  position: relative;
  z-index: 0;
}
.card-image-container::after {
  content: '';
  background-color: rgba(0, 0, 0, 0.3);
  height: 100%;
  position: relative;
  display: block;
  bottom: 320px;
}
.group-flag-container {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid var(--card-bg);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  background-color: var(--primary-color);
  position: relative;
  left: 15px;
  bottom: 110px;
  z-index: 1;
}
.group-flag-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem; font-weight: bold; color: var(--header-text);
}
.group-cover, .group-flag { width: 100%; height: 100%; object-fit: cover; }
.group-cover-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3.5rem; font-weight: bold;
}
.card-content {
  padding: 1.25rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.category-name {
  font-size: 1.4rem;
  color: var(--primary-color);
  margin-bottom: 0.3rem;
  font-weight: 600;
}
.group-status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.group-status-icon {
  flex-shrink: 0;
}
.group-status-badge.open {
  color: var(--primary-color);
}
.group-status-badge.closed {
  color: #b81727;
}
.group-description {
  font-size: 0.9rem; color: #555;
  margin-bottom: 1rem; line-height: 1.6;
  flex-grow: 1;
}
.line-clamp {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden; text-overflow: ellipsis;
  min-height: calc(0.9rem * 1.6 * 1); /* Garante espaço para pelo menos 1 linha */
  max-height: calc(0.9rem * 1.6 * 3); /* Espaço para até 3 linhas */
}

.card-actions {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
}
.action-button {
  font-size: 0.8rem;
  padding: 0.6em 1em;
  text-align: center;
  white-space: nowrap;
}

.bias-declared-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--primary-color);
  white-space: nowrap;
}
.bias-declared-icon {
  flex-shrink: 0;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
  color: #555;
}
.error-message, .no-categories {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
  color: #555;
}
.no-categories button { margin-top: 1rem; }
</style>
