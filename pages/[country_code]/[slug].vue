<template>
  <div class="group-page">
    <div v-if="isLoading" class="loading-spinner container">
      Carregando dados do grupo...
    </div>
    <div v-else-if="!groupData && !isLoading" class="group-not-found container">
      <h2>Grupo não encontrado</h2>
      <p>O grupo que você está procurando não existe ou o link está incorreto.</p>
      <NuxtLink to="/categories" class="button-primary">Explorar Categorias</NuxtLink>
    </div>
    <div v-else-if="groupData" class="group-content">
      <header class="group-header">
        <div class="header-background-image" :style="headerBackgroundStyle"></div>
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
              País: {{ groupData.country_code.toUpperCase() }}
              <span v-if="groupData.taxon">| Categoria: {{ groupData.taxon.name }}</span>
              <span v-if="groupData.is_open">| Grupo Aberto</span>
            </p>
          </div>
          <div class="group-actions">
            <button class="button-primary">Participar / Seguir (Em breve)</button>
          </div>
        </div>
      </header>

      <div class="group-body container">
        <div class="main-column">
          <p v-if="groupData.description" class="group-description">
            {{ groupData.description }}
          </p>
          <CreatePostForm v-if="groupData" 
            :owner-id="groupData.id"
            owner-type="group"
            @post-created="handleNewPost"
            class="create-post-component"
          />
          <section class="posts-list-section">
            <!-- <h3>Postagens Recentes</h3> -->
            <PostList :posts="posts" :is-loading="isLoadingPosts" empty-message="Nenhuma postagem neste grupo ainda. Seja o primeiro!" />
          </section>
        </div>
        <aside class="sidebar-column">
          <section class="user-groups-sidebar card-style">
            <h4>Seus Grupos</h4>
            <p>(Lista de grupos do usuário em breve)</p>
          </section>
          <section class="subgroups-sidebar card-style" v-if="subgroups.length > 0">
            <h4>Subgrupos</h4>
            <ul>
              <li v-for="subgroup in subgroups" :key="subgroup.id">
                <NuxtLink :to="`/${subgroup.country_code}/${subgroup.slug}`">{{ subgroup.name }}</NuxtLink>
              </li>
            </ul>
          </section>
          <section class="members-sidebar card-style">
            <h4>Membros ({{ groupData.members_count || 0 }})</h4>
            <p>(Lista de membros em breve)</p>
          </section>
          <section class="events-sidebar card-style">
            <h4>Eventos</h4>
            <p>(Eventos do grupo em breve)</p>
          </section>
          <section class="debates-sidebar card-style">
            <h4>Debates</h4>
            <p>(Debates do grupo em breve)</p>
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
import type { Database } from '~/types/supabase';
import type { GroupData, SubgroupData, DisplayPost, PostFromQuery } from '~/types/app';
import { useToast } from 'vue-toastification';

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const toast = useToast();
const user = useSupabaseUser();

const groupData = ref<GroupData | null>(null);
const subgroups = ref<SubgroupData[]>([]);
const posts = ref<DisplayPost[]>([]);
const isLoading = ref(true);
const isLoadingPosts = ref(false);

const groupSlug = computed(() => route.params.slug as string);
const countryCodeParam = computed(() => route.params.country_code as string);


const groupFlagUrl = computed(() => {
  if (groupData.value?.flag_path) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${groupData.value.flag_path}`;
  }
  return '';
});

const headerBackgroundStyle = computed(() => {
  if (groupData.value?.cover_image_path) {
    const coverUrl = `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/covers/${groupData.value.cover_image_path}`;
    return { backgroundImage: `url('${coverUrl}')` };
  }
  return { backgroundColor: 'var(--primary-color-light)' };
});

async function fetchPostsForGroup(groupId: string) {
  isLoadingPosts.value = true;
  try {
    const { data, error } = await supabase
      .from('posts_with_author_info') // <<< USANDO A VIEW
      .select(`*`) // Seleciona todas as colunas da view
      .eq('owner_id', groupId)
      .eq('owner_type', 'group')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data) posts.value = data as DisplayPost[];
  } catch (e: any) {
    console.error('Erro ao buscar posts:', e);
    toast.error(e.message || 'Falha ao carregar posts.');
  } finally {
    isLoadingPosts.value = false;
  }
}

async function fetchGroupData(country: string, slug: string): Promise<void> {
  isLoading.value = true;
  groupData.value = null;
  subgroups.value = [];

  if (!slug || !country) {
    toast.error('Informações do grupo incompletas para carregar a página.');
    isLoading.value = false;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id, name, slug, description, flag_path, country_code, is_open,
        category_group_id, parent_group_id, cover_image_path,
        taxon:taxons ( name )
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
      const taxonData = Array.isArray(data.taxon) && data.taxon.length > 0
                        ? data.taxon[0]
                        : (data.taxon && typeof data.taxon === 'object' ? data.taxon : null);
      groupData.value = { ...data, taxon: taxonData } as GroupData;

      if(groupData.value){
        const { data: subData, error: subError } = await supabase
          .from('groups')
          .select('id, name, slug, country_code')
          .eq('parent_group_id', groupData.value.id)
          .eq('country_code', country)
          .order('name', {ascending: true});

        if(subError) throw subError;
        if(subData) subgroups.value = subData as SubgroupData[];

        await fetchPostsForGroup(groupData.value.id);
      }
    } else {
      // Este caso não deve ser alcançado se .single() e PGRST116 são tratados
      toast.error(`Grupo "${slug}" no país "${country.toUpperCase()}" não foi encontrado.`);
    }

  } catch (e: any) {
    console.error('Erro ao buscar dados do grupo:', e);
    toast.error(e.message || 'Falha ao carregar dados do grupo.');
    groupData.value = null;
  } finally {
    isLoading.value = false;
  }
}

function handleNewPost(newPostData: PostFromQuery) {
  console.log('Novo post recebido na página do grupo:', newPostData);
  // Formatar o newPostData para a estrutura DisplayPost se necessário
  // e adicionar ao topo da lista de posts
  const authorProfile = Array.isArray(newPostData.profiles) ? newPostData.profiles[0] : newPostData.profiles;
  const displayPost: DisplayPost = {
    id: newPostData.id,
    author_id: newPostData.author_id,
    author_username: authorProfile?.username || null,
    author_avatar_path: authorProfile?.avatar_url || null,
    text_content: newPostData.text_content,
    image_path: newPostData.image_path,
    video_url: newPostData.video_url,
    is_edited: newPostData.is_edited,
    is_anonymous: newPostData.is_anonymous,
    created_at: newPostData.created_at,
  };
  posts.value.unshift(displayPost); // Adiciona no início da lista
  toast.info('Seu post foi adicionado à lista!');
}

watch(
  () => [route.params.country_code, route.params.slug],
  ([newCountry, newSlug]) => {
    if (newCountry && newSlug && typeof newCountry === 'string' && typeof newSlug === 'string') {
      fetchGroupData(newCountry, newSlug);
    }
  },
  { immediate: true, deep: true } // deep: true pode não ser necessário aqui, mas não prejudica
);

// Atualizar título da página
 watch(groupData, (newData) => {
  if (newData?.name) {
    useHead({
      title: `${newData.name} - TruthSeek Network`,
      meta: [{ name: 'description', content: newData.description || `Página do grupo ${newData.name}` }]
    });
  } else if (!isLoading.value && !newData) { // Se não está carregando e não encontrou dados
    useHead({
      title: `Grupo Não Encontrado - TruthSeek Network`,
    });
  }
}, { immediate: true });
</script>

<style scoped>
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

.sidebar-column .card-style { /* Estilo comum para cards na sidebar */
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
