<!-- pages/categories.vue -->
<template>
  <div class="categories-page container">
    <h1>Explorar Categorias e Grupos</h1>
    <p class="intro">
      Navegue pelas categorias de discussão. Por padrão, exibimos os grupos
      disponíveis para o Brasil.
    </p>

    <div v-if="isLoading" class="loading-spinner">
      Carregando categorias...
    </div>

    <div v-if="categoryGroups.length > 0" class="categories-grid">
      <div
        v-for="category in categoryGroups"
        :key="category.id"
        class="category-card"
      >
        <NuxtLink :to="`/${category.country_code}/${category.slug}`" class="category-link">
          <!-- Container para a imagem/placeholder -->
          <div class="category-image-container">
            <img
              v-if="category.flag_path"
              :src="`https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${category.flag_path}`"
              :alt="`Bandeira ${category.name}`"
              class="category-flag"
            />
            <div v-else class="category-image-placeholder">
              <span>{{ category.name.substring(0, 1) }}</span>
            </div>
          </div>

          <h2 class="category-name">{{ category.name }}</h2>
          <p class="group-country-info line-clamp"> <!-- Adicionada classe line-clamp -->
            {{ category.description }}
          </p>
          <span class="enter-group-button button-secondary">Entrar no Grupo</span>
        </NuxtLink>
      </div>
    </div>
    <div v-else class="no-categories">
      <p>Nenhuma categoria ou grupo encontrado para os critérios selecionados.</p>
    </div>

    <!-- Futuramente: Filtros por país, busca, etc. -->
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

interface CategoryGroupDisplay {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  flag_path: string | null;
  country_code: string;
}

const supabase = useSupabaseClient();
const toast = useToast();

const categoryGroups = ref<CategoryGroupDisplay[]>([]);
const isLoading = ref(true);

async function fetchRootCategoryGroups(countryCode: string = 'br'): Promise<void> {
  isLoading.value = true;
  try {
    // A coluna 'category_group_id' sendo NULL indica uma categoria raiz.
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        slug,
        flag_path,
        country_code
      `)
      .is('category_group_id', null)
      .eq('country_code', countryCode)
      .order('name', { ascending: true });

    if (error) throw error;

    if (data) {
      console.log(data);
      categoryGroups.value = data as CategoryGroupDisplay[];
    }
  } catch (e: any) {
    console.error('Erro ao buscar categorias e grupos:', e);
    toast.error(e.message || 'Falha ao carregar dados.');
  } finally {
    isLoading.value = false;
  }
}

useHead({
  title: 'Categorias - TruthSeek Network',
  meta: [
    { name: 'description', content: 'Explore as categorias de debate da TruthSeek Network.' }
  ]
});

onMounted(() => {
  fetchRootCategoryGroups('br'); // Carregar grupos do Brasil por padrão
});
</script>

<style scoped>
.categories-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
}

.categories-page h1 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}
.categories-page p.intro {
  text-align: center;
  margin-bottom: 2.5rem;
  color: #555;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  overflow: hidden;
}
.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.12);
}

.category-link {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.category-image-container {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--primary-color-light);
}

.category-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 3rem;
  font-weight: bold;
}

.category-flag {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-name {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.line-clamp {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  /* Altura mínima para garantir espaço mesmo com poucas linhas, ajuste conforme necessário */
  min-height: calc(0.9rem * 1.7 * 1); /* (font-size * line-height * num_linhas_minimas) */
  /* Altura máxima para quando tem 3 linhas */
  max-height: calc(0.9rem * 1.7 * 3);
}

.group-country-info {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.7;
}

.enter-group-button {
  margin-top: auto;
  text-align: center;
  padding: 0.6em 1em;
  font-size: 0.95rem;
}

.loading-spinner, .error-message, .no-categories {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
  color: #555;
}
.error-message {
  color: #dc3545;
}
</style>
