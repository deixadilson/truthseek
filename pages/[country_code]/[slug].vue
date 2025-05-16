<template>
  <div class="group-page">
    <div v-if="isLoading" class="loading-spinner container">
      Carregando dados do grupo...
    </div>
    <div v-else-if="errorLoading" class="error-message container">
      {{ errorLoading }}
      <p><NuxtLink to="/categories" class="button-secondary">Voltar para Categorias</NuxtLink></p>
    </div>
    <div v-else-if="groupData" class="group-content">
      <!-- Cabeçalho do Grupo (Item 10.1) -->
      <header class="group-header">
        <div class="header-background-image" :style="headerBackgroundStyle">
          <!-- Imagem de capa do grupo (se houver) -->
        </div>
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
              <!-- Ex: País, tipo de grupo (Categoria/Viés), etc. -->
              País: {{ groupData.country_code.toUpperCase() }}
              <span v-if="groupData.taxon">| Categoria: {{ groupData.taxon.name }}</span>
              <span v-if="groupData.is_open">| Grupo Aberto</span>
            </p>
          </div>
          <div class="group-actions">
            <!-- Botões: Seguir, Entrar no Grupo, Configurações (se admin), etc. -->
            <button class="button-primary">Participar / Seguir (Em breve)</button>
          </div>
        </div>
      </header>

      <div class="group-body container">
        <div class="main-column">
          <p v-if="groupData.description" class="group-description">
            {{ groupData.description }}
          </p>

          <!-- Formulário para Criar Post (Item 10.2) - Placeholder -->
          <section class="create-post-section card-style">
            <h3>Criar Nova Postagem (Em breve)</h3>
            <textarea placeholder="O que você tem em mente?"></textarea>
            <button class="button-primary">Postar</button>
          </section>

          <!-- Listagem de Posts (Item 10.3) - Placeholder -->
          <section class="posts-list-section card-style">
            <h3>Postagens Recentes</h3>
            <p>Nenhuma postagem ainda. (Conteúdo de posts em breve)</p>
            <!-- Loop v-for para posts aqui -->
          </section>
        </div>

        <aside class="sidebar-column">
          <!-- Bloco de links para grupos do usuário (Item 10.6) - Placeholder -->
          <section class="user-groups-sidebar card-style">
            <h4>Seus Grupos</h4>
            <p>(Lista de grupos do usuário em breve)</p>
          </section>

          <!-- Lista de Subgrupos (Item 10.7) - Placeholder -->
          <section class="subgroups-sidebar card-style" v-if="subgroups.length > 0">
            <h4>Subgrupos</h4>
            <ul>
              <li v-for="subgroup in subgroups" :key="subgroup.id">
                <NuxtLink :to="`/g/${subgroup.slug}`">{{ subgroup.name }}</NuxtLink>
              </li>
            </ul>
          </section>

          <!-- Lista de Membros (Item 10.9) - Placeholder -->
          <section class="members-sidebar card-style">
            <h4>Membros ({{ groupData.members_count || 0 }})</h4>
            <p>(Lista de membros em breve)</p>
          </section>

          <!-- Eventos do Grupo (Item 10.10) - Placeholder -->
          <section class="events-sidebar card-style">
            <h4>Eventos</h4>
            <p>(Eventos do grupo em breve)</p>
          </section>

          <!-- Debates do Grupo (Item 10.11) - Placeholder -->
          <section class="debates-sidebar card-style">
            <h4>Debates</h4>
            <p>(Debates do grupo em breve)</p>
          </section>

          <!-- Link para Detalhes do Grupo (Item 10.12) - Placeholder -->
          <NuxtLink :to="`/g/${groupData.slug}/details`" class="details-link">
            Ver Detalhes do Grupo
          </NuxtLink>
        </aside>
      </div>
    </div>
    <div v-else class="group-not-found container">
      <h2>Grupo não encontrado</h2>
      <p>O grupo que você está procurando não existe ou foi movido.</p>
      <NuxtLink to="/categories" class="button-primary">Explorar Categorias</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'; // Importar tipos
import { useToast } from 'vue-toastification';

// Interface para os dados do grupo que esperamos
// Idealmente, isso seria gerado ou mais granular com base nos selects
interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  flag_path: string | null;
  country_code: string;
  is_open: boolean;
  category_group_id: string | null; // Se é um grupo raiz de categoria
  taxon: { name: string } | null; // Para mostrar o nome do taxon associado
  parent_group_id: string | null;
  // Adicionar mais campos conforme necessário, como uma contagem de membros
  members_count?: number; // Exemplo
  cover_image_path?: string | null; // Para a imagem de capa do header
}
interface SubgroupData {
  id: string;
  name: string;
  slug: string;
}

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const toast = useToast();

const groupData = ref<GroupData | null>(null);
const subgroups = ref<SubgroupData[]>([]);
const isLoading = ref(true);
const errorLoading = ref<string | null>(null);
const groupSlug = computed(() => route.params.slug as string);

const groupFlagUrl = computed(() => {
  if (groupData.value?.flag_path) {
    // Construa a URL completa do Supabase Storage aqui
    // Ex: `https://<seu-id-projeto>.supabase.co/storage/v1/object/public/flags/${groupData.value.flag_path}`
    // Certifique-se que o bucket 'flags' é público ou você tem a lógica para URLs assinadas.
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${groupData.value.flag_path}`;
  }
  return ''; // Ou uma URL de placeholder de flag
});

const headerBackgroundStyle = computed(() => {
    if (groupData.value?.cover_image_path) {
        const coverUrl = `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/covers/${groupData.value.cover_image_path}`;
        return { backgroundImage: `url('${coverUrl}')` };
    }
    return { backgroundColor: 'var(--primary-color-light)' }; // Cor de fundo padrão
});


async function fetchGroupData(slug: string): Promise<void> {
  isLoading.value = true;
  errorLoading.value = null;
  groupData.value = null; // Limpar dados anteriores
  subgroups.value = [];

  if (!slug) {
    errorLoading.value = 'Slug do grupo não fornecido.';
    isLoading.value = false;
    return;
  }

  try {
    // Buscar o grupo principal
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        slug,
        description,
        flag_path,
        country_code,
        is_open,
        category_group_id,
        parent_group_id,
        cover_image_path,
        taxon:taxons ( name )
      `)
      .eq('slug', slug)
      .single(); // Esperamos apenas um grupo com este slug

    if (error) {
      if (error.code === 'PGRST116') { // "single" não encontrou nenhuma linha
        throw new Error(`Grupo com slug "${slug}" não encontrado.`);
      }
      throw error;
    }

    if (data) {
      // O Supabase retorna o taxon como um objeto se a relação for um-para-um
      // ou um array se for um-para-muitos (mesmo que só haja um).
      // Ajuste conforme a estrutura real do seu retorno.
      const taxonData = Array.isArray(data.taxon) && data.taxon.length > 0
                        ? data.taxon[0]
                        : (data.taxon && typeof data.taxon === 'object' ? data.taxon : null);

      groupData.value = { ...data, taxon: taxonData } as GroupData;

      // Buscar subgrupos (grupos que têm este grupo como parent_group_id)
      if(groupData.value){
        const { data: subData, error: subError } = await supabase
            .from('groups')
            .select('id, name, slug')
            .eq('parent_group_id', groupData.value.id)
            .order('name', {ascending: true});

        if(subError) throw subError;
        if(subData) subgroups.value = subData;
      }

    } else {
      // Este caso não deveria ser alcançado se .single() e o erro PGRST116 forem tratados
       errorLoading.value = `Grupo "${slug}" não encontrado.`;
    }

  } catch (e: any) {
    console.error('Erro ao buscar dados do grupo:', e);
    errorLoading.value = e.message || 'Falha ao carregar dados do grupo.';
    toast.error(errorLoading.value);
  } finally {
    isLoading.value = false;
  }
}

// Definir título da página dinamicamente
watch(groupData, (newData) => {
  if (newData?.name) {
    useHead({
      title: `${newData.name} - TruthSeek Network`,
      meta: [
        { name: 'description', content: newData.description || `Página do grupo ${newData.name} na TruthSeek Network.` }
      ]
    });
  } else if (errorLoading.value) {
    useHead({
      title: `Erro - TruthSeek Network`,
    });
  }
}, { immediate: true });


// Buscar dados quando o slug mudar (ex: navegação entre grupos)
// ou na montagem inicial.
watch(
  () => route.params.slug, // Observar o parâmetro da rota
  (newSlug) => {
    if (newSlug && typeof newSlug === 'string') {
      fetchGroupData(newSlug);
    }
  },
  { immediate: true } // Executar imediatamente na montagem
);
</script>

<style scoped>
.group-page {
  /* Sem padding-top aqui, o header do grupo cuidará disso */
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
  padding-top: 100px; /* Espaço para a imagem de capa não sobrepor o conteúdo inicial */
  padding-bottom: 1.5rem;
  display: flex;
  align-items: flex-end; /* Alinha flag e título na base */
  gap: 1.5rem;
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
}

.group-actions {
  margin-left: auto; /* Empurra para a direita */
  align-self: flex-end; /* Alinha com a base dos outros itens */
}
.group-actions .button-primary {
  background-color: rgba(255,255,255,0.9);
  color: var(--primary-color);
  border-color: transparent;
}
.group-actions .button-primary:hover {
  background-color: #fff;
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

.main-column {
  /* Estilos para a coluna principal (posts, etc.) */
}
.sidebar-column {
  /* Estilos para a sidebar */
}
.sidebar-column .card-style { /* Estilo comum para cards na sidebar */
  margin-bottom: 1.5rem;
}

.card-style { /* Estilo base para seções de conteúdo */
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}
.card-style h3, .card-style h4 {
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.group-description {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
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

.posts-list-section p, .subgroups-sidebar p, .members-sidebar p, .events-sidebar p, .debates-sidebar p {
  color: #777;
  font-style: italic;
}
.subgroups-sidebar ul {
  list-style: none;
  padding-left: 0;
}
.subgroups-sidebar li a {
  display: block;
  padding: 0.5rem 0;
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--border-color);
}
.subgroups-sidebar li:last-child a {
  border-bottom: none;
}
.subgroups-sidebar li a:hover {
  color: var(--primary-color-dark);
}

.details-link {
  display: block;
  text-align: center;
  margin-top: 1rem;
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


.loading-spinner, .error-message, .group-not-found {
  text-align: center;
  padding: 3rem 1rem;
}
.error-message p, .group-not-found p { margin-bottom: 1.5rem; }
</style>