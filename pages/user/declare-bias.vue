<template>
  <div class="declare-bias-page container">
    <h1>Declarar Novo Viés</h1>
    <p class="intro">
      Navegue pelas categorias e grupos para encontrar o viés que você deseja defender.
      Você só pode declarar vieses de grupos fechados (não abertos).
    </p>

    <!-- Breadcrumbs -->
    <nav aria-label="breadcrumb" class="breadcrumb-nav" v-if="breadcrumbs.length > 0">
      <ul>
        <li><NuxtLink to="/user/declare-bias" @click="resetNavigation">Categorias Raiz</NuxtLink></li>
        <li v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
          <span v-if="index === breadcrumbs.length - 1" aria-current="page">{{ crumb.name }}</span>
          <NuxtLink v-else :to="`/user/declare-bias?parentId=${crumb.id}&country=${currentCountryCode}`" @click="navigateToParent(crumb.id)">
            {{ crumb.name }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div v-if="isLoading" class="loading-spinner">Carregando grupos...</div>
    <div v-else-if="errorLoading" class="error-message">{{ errorLoading }}</div>

    <div v-else class="groups-list-container">
      <div v-if="currentGroupsToList.length > 0" class="groups-grid">
        <div
          v-for="group in currentGroupsToList"
          :key="group.id"
          class="group-card"
          :class="{ 'open-group': group.is_open, 'closed-group': !group.is_open }"
        >
          <div class="group-card-image-container">
            <img
              v-if="group.flag_path"
              :src="`https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${group.flag_path}`"
              :alt="`Bandeira ${group.name}`"
              class="group-flag"
            />
            <div v-else class="group-image-placeholder">
              <span>{{ group.name.substring(0, 1) }}</span>
            </div>
          </div>
          <div class="group-card-content">
            <h2 class="group-name">{{ group.name }}</h2>
            <p v-if="group.description" class="group-description line-clamp">
              {{ group.description }}
            </p>
            <div class="group-actions">
              <button
                v-if="!group.is_open && !isAlreadyDeclared(group.id)"
                @click="declareThisBias(group.id)"
                class="button-primary declare-btn"
                :disabled="isDeclaring"
              >
                Declarar este Viés
              </button>
              <span v-if="!group.is_open && isAlreadyDeclared(group.id)" class="already-declared-chip">
                Já Declarado
              </span>
              <NuxtLink
                v-if="group.is_open"
                :to="`/user/declare-bias?parentId=${group.id}&country=${currentCountryCode}`"
                @click="navigateToChildren(group)"
                class="button-secondary view-subgroups-btn"
              >
                Ver Subgrupos
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="no-groups-message">
        Nenhum subgrupo ou viés encontrado nesta categoria para o país selecionado.
      </p>
    </div>
    <!-- Futuro: Seletor de País -->
    <!-- <div class="country-selector"> ... </div> -->
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { Group, Bias } from '~/types/app'; // Usaremos GroupData
import { useToast } from 'vue-toastification';

interface BreadcrumbItem {
  id: string;
  name: string;
}

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const toast = useToast();
const route = useRoute();
const router = useRouter();

const allGroupsForCountry = ref<Group[]>([]); // Todos os grupos do país para filtrar localmente
const currentGroupsToList = ref<Group[]>([]); // Grupos a serem exibidos no nível atual
const userDeclaredBiases = ref<Bias[]>([]); // Vieses já declarados pelo usuário

const isLoading = ref(true);
const errorLoading = ref<string | null>(null);
const isDeclaring = ref(false);

const currentParentId = ref<string | null>(route.query.parentId as string || null);
const currentCountryCode = ref<string>((route.query.country as string) || 'br'); // Default para Brasil
const breadcrumbs = ref<BreadcrumbItem[]>([]);

async function fetchData() {
  isLoading.value = true;
  errorLoading.value = null;
  try {
    // 1. Buscar todos os grupos do país selecionado (otimização: pode buscar apenas o nível necessário)
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, description, flag_path, is_open, parent_group_id, level')
      .eq('country_code', currentCountryCode.value)
      .order('level')
      .order('name');
    if (groupsError) throw groupsError;
    allGroupsForCountry.value = groupsData as Group[] || [];

    // 2. Buscar vieses já declarados pelo usuário
    if (user.value) {
      const { data: biasesData, error: biasesError } = await supabase
        .from('biases')
        .select('id, group_id, influence_points')
        .eq('user_id', user.value.id);
      if (biasesError) throw biasesError;
      userDeclaredBiases.value = biasesData as Bias[] || [];
    }
    updateDisplay();
  } catch (e: any) {
    console.error("Erro ao buscar dados para declaração de viés:", e);
    errorLoading.value = e.message || "Falha ao carregar dados.";
    toast.error(errorLoading.value);
  } finally {
    isLoading.value = false;
  }
}

function updateDisplay() {
  // Filtrar grupos para o nível atual
  if (currentParentId.value) {
    currentGroupsToList.value = allGroupsForCountry.value.filter(
      g => g.parent_group_id === currentParentId.value
    );
  } else { // Nível raiz
    currentGroupsToList.value = allGroupsForCountry.value.filter(
      g => g.level === 0 // ou g.parent_group_id === null, dependendo da sua lógica de raiz
    );
  }
  buildBreadcrumbs();
}

function buildBreadcrumbs() {
  const newCrumbs: BreadcrumbItem[] = [];
  let parentId = currentParentId.value;
  while (parentId) {
    const parentGroup = allGroupsForCountry.value.find(g => g.id === parentId);
    if (parentGroup) {
      newCrumbs.unshift({ id: parentGroup.id, name: parentGroup.name });
      parentId = parentGroup.parent_group_id;
    } else {
      break; // Evitar loop infinito se a hierarquia estiver quebrada
    }
  }
  breadcrumbs.value = newCrumbs;
}

function navigateToChildren(group: Group) {
  currentParentId.value = group.id;
  // Atualizar a URL sem recarregar a página (o watcher cuidará do fetch)
  router.push({ query: { parentId: group.id, country: currentCountryCode.value } });
  // updateDisplay(); // O watcher em currentParentId fará isso
}
function navigateToParent(parentId: string | null) {
  currentParentId.value = parentId;
  router.push({ query: { parentId: parentId, country: currentCountryCode.value } });
  // updateDisplay();
}
function resetNavigation() {
  currentParentId.value = null;
  router.push({ query: { country: currentCountryCode.value } }); // Mantém o país
  // updateDisplay();
}

function isAlreadyDeclared(groupId: string): boolean {
  return userDeclaredBiases.value.some(bias => bias.group_id === groupId);
}

async function declareThisBias(groupId: string) {
  if (!user.value) {
    toast.error("Você precisa estar logado para declarar um viés.");
    router.push(`/user/login?redirectTo=${route.fullPath}`);
    return;
  }
  isDeclaring.value = true;
  try {
    const { data, error } = await supabase
      .from('biases')
      .insert({ user_id: user.value.id, group_id: groupId })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('unique constraint')) { // Tratar erro de já declarado
        toast.error('Você já declarou este viés anteriormente.');
        // Atualizar a lista de vieses declarados para refletir isso na UI
        const existingBias = userDeclaredBiases.value.find(b => b.group_id === groupId);
        if (!existingBias && data) userDeclaredBiases.value.push(data as Bias);

      } else {
        throw error;
      }
    } else if (data) {
      toast.success('Viés declarado com sucesso!');
      userDeclaredBiases.value.push(data as Bias); // Atualiza UI otimista
      // Não precisa re-buscar tudo, apenas o estado local do botão muda
    }
  } catch (e: any) {
    toast.error(e.message || "Erro ao declarar viés.");
  } finally {
    isDeclaring.value = false;
  }
}

// Observar mudanças nos parâmetros da rota para atualizar a visualização
watch(() => route.query, (newQuery) => {
  const newParentId = newQuery.parentId as string || null;
  const newCountry = newQuery.country as string || currentCountryCode.value; // Manter país se não especificado

  // Se o país mudou, precisamos re-buscar todos os grupos daquele país
  if (newCountry !== currentCountryCode.value) {
    currentCountryCode.value = newCountry;
    currentParentId.value = newParentId; // Atualiza parentId junto com o país
    fetchData(); // Re-busca tudo para o novo país
  } else if (newParentId !== currentParentId.value) {
    currentParentId.value = newParentId;
    updateDisplay(); // Apenas filtra os grupos já carregados
  }
}, { deep: true });


onMounted(() => {
  fetchData();
});

useHead({
  title: 'Declarar Viés - TruthSeek Network',
  meta: [{ name: 'description', content: 'Explore e declare os vieses que você defende.' }]
});
</script>

<style scoped>
.declare-bias-page { padding-top: 2rem; padding-bottom: 3rem; }
.declare-bias-page h1 { text-align: center; color: var(--primary-color); margin-bottom: 0.5rem; }
.declare-bias-page p.intro { text-align: center; margin-bottom: 2rem; color: #555; max-width: 700px; margin-left: auto; margin-right: auto; }

.breadcrumb-nav { margin-bottom: 1.5rem; background-color: var(--card-bg); padding: 0.75rem 1rem; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.breadcrumb-nav ul { list-style: none; padding: 0; margin: 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.breadcrumb-nav li { font-size: 0.9rem; }
.breadcrumb-nav li:not(:last-child)::after { content: '>'; margin-left: 0.5rem; color: #888; }
.breadcrumb-nav a { color: var(--primary-color); text-decoration: none; }
.breadcrumb-nav a:hover { text-decoration: underline; }
.breadcrumb-nav span[aria-current="page"] { color: var(--text-color); font-weight: 500; }

.groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.group-card {
  background-color: var(--card-bg); border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
  transition: box-shadow 0.2s ease-in-out;
}
.group-card:hover { box-shadow: 0 5px 15px rgba(0,0,0,0.12); }

.group-card-image-container {
  width: 100%; height: 160px; display: flex; align-items: center;
  justify-content: center; background-color: var(--primary-color-light);
  border-top-left-radius: 8px; border-top-right-radius: 8px; overflow: hidden;
}
.group-flag { width: 100%; height: 100%; object-fit: cover; }
.group-image-placeholder { font-size: 3.5rem; font-weight: bold; color: var(--primary-color); }

.group-card-content { padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1; }
.group-name { font-size: 1.3rem; color: var(--primary-color); margin-top: 0; margin-bottom: 0.5rem; }
.group-description { font-size: 0.85rem; color: #666; margin-bottom: 1rem; line-height: 1.5; flex-grow: 1; }
/* line-clamp já definido globalmente ou em categories.vue, pode ser reutilizado */
.line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }


.group-actions { margin-top: auto; /* Empurra para baixo */ }
.declare-btn, .view-subgroups-btn { width: 100%; padding: 0.7em 1em; font-size: 0.9rem; }
.already-declared-chip {
  display: inline-block; padding: 0.4em 0.8em; font-size: 0.8rem;
  background-color: #e9ecef; color: #495057; border-radius: 1em;
  text-align: center; width: 100%;
}

.no-groups-message { text-align: center; padding: 2rem; color: #777; }
.loading-spinner, .error-message { text-align: center; padding: 2rem; }
</style>