<template>
  <div class="timeline-page container">
    <header class="timeline-header">
      <h1>Meu feed</h1>
      <p class="timeline-subtitle">
        Posts dos grupos que você participa e de usuários que você segue.
      </p>
    </header>

    <div v-if="isLoading && posts.length === 0" class="loading-spinner">
      <LoadingMessage message="Carregando feed..." />
    </div>

    <template v-else>
      <PostList
        :posts="posts"
        :is-loading="false"
        :has-more="hasMore"
        :is-loading-more="isLoadingMore"
        empty-message="Seu feed está vazio. Declare vieses em grupos ou siga outros usuários para ver posts aqui."
        @post-deleted="handlePostDeleted"
        @post-updated="handlePostUpdated"
        @load-more="loadMore"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PostWithAuthor } from '~/types/app';
import type { Database } from '~/types/supabase';
import { enrichPostsWithOwnerGroups } from '~/utils/enrichPostsWithOwnerGroups';

const supabase = useSupabaseClient<Database>();
const PAGE_SIZE = 20;

const posts = ref<PostWithAuthor[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const hasMore = ref(false);

async function fetchPage(before?: string | null, append = false) {
  const { data, error } = await supabase.rpc('get_timeline_posts', {
    p_limit: PAGE_SIZE,
    p_before: before ?? undefined,
  });
  if (error) throw error;

  const rows = await enrichPostsWithOwnerGroups(
    supabase,
    (data || []) as PostWithAuthor[]
  );
  if (append) {
    const existing = new Set(posts.value.map((p) => p.id));
    posts.value = [...posts.value, ...rows.filter((p) => p.id && !existing.has(p.id))];
  } else {
    posts.value = rows;
  }
  hasMore.value = rows.length >= PAGE_SIZE;
}

async function loadInitial() {
  isLoading.value = true;
  try {
    await fetchPage(null, false);
  } catch (e) {
    console.error('Erro ao carregar feed:', e);
    posts.value = [];
    hasMore.value = false;
  } finally {
    isLoading.value = false;
  }
}

async function loadMore() {
  if (isLoadingMore.value || !hasMore.value || posts.value.length === 0) return;
  const last = posts.value[posts.value.length - 1];
  if (!last?.created_at) return;

  isLoadingMore.value = true;
  try {
    await fetchPage(last.created_at, true);
  } catch (e) {
    console.error('Erro ao carregar mais posts:', e);
  } finally {
    isLoadingMore.value = false;
  }
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

onMounted(loadInitial);
</script>

<style scoped>
.timeline-page {
  max-width: 720px;
  padding-top: 1.75rem;
  padding-bottom: 3rem;
}

.timeline-header {
  margin-bottom: 1.25rem;
}

.timeline-header h1 {
  margin: 0 0 0.35rem;
  color: var(--primary-color);
  font-size: 1.75rem;
}

.timeline-subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 2.5rem 1rem;
}
</style>
