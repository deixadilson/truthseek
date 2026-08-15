<template>
  <div class="post-list">
    <div v-if="visiblePosts.length === 0 && !isLoading" class="no-posts-message">
      <p>{{ emptyMessage || 'Nenhuma postagem para exibir ainda.' }}</p>
    </div>
    <PostItem
      v-for="post in visiblePosts"
      :key="`${post.id}`"
      :post="post"
      :show-group-context="showGroupContext"
      @deleted="(id) => emit('post-deleted', id)"
      @updated="(payload) => emit('post-updated', payload)"
    />
    <div v-if="isLoading && posts.length === 0" class="loading-more-posts">
      <LoadingMessage message="Carregando posts..." />
    </div>
    <div v-if="hasMore" class="load-more-wrap">
      <button
        type="button"
        class="button-secondary"
        :disabled="isLoadingMore"
        @click="emit('load-more')"
      >
        <LoadingMessage v-if="isLoadingMore" message="Carregando..." :icon-size="16" />
        <template v-else>Carregar mais</template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostWithAuthor } from '~/types/app';

const props = withDefaults(
  defineProps<{
    posts: PostWithAuthor[];
    isLoading?: boolean;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    emptyMessage?: string;
    showGroupContext?: boolean;
  }>(),
  {
    showGroupContext: true,
    hasMore: false,
    isLoadingMore: false,
  }
);

const emit = defineEmits<{
  (e: 'post-deleted', postId: string): void;
  (e: 'post-updated', payload: { id: string; text_content: string | null; image_path: string | null; video_url: string | null; is_edited: boolean; updated_at: string }): void;
  (e: 'load-more'): void;
}>();

const { isAuthorHidden } = useBlock();
const visiblePosts = computed(() =>
  props.posts.filter((post) => !isAuthorHidden(post.author_id))
);
</script>

<style scoped>
.no-posts-message {
  text-align: center;
  padding: 2rem;
  color: #777;
  font-style: italic;
  background-color: var(--card-bg);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.loading-more-posts {
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 1.5rem;
  color: #555;
}
.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
.load-more-wrap .button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.1rem;
  text-decoration: none;
}
</style>
