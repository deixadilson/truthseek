<template>
  <div class="post-list">
    <div v-if="posts.length === 0 && !isLoading" class="no-posts-message">
      <p>{{ emptyMessage || 'Nenhuma postagem para exibir ainda.' }}</p>
    </div>
    <PostItem
      v-for="post in posts"
      :key="`${post.id}`"
      :post="post"
      @deleted="(id) => emit('post-deleted', id)"
      @updated="(payload) => emit('post-updated', payload)"
    />
    <div v-if="isLoading" class="loading-more-posts">
      <LoadingMessage message="Carregando mais posts..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostWithAuthor } from '~/types/app';

defineProps<{
  posts: PostWithAuthor[];
  isLoading?: boolean;
  emptyMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'post-deleted', postId: string): void;
  (e: 'post-updated', payload: { id: string; text_content: string | null; image_path: string | null; video_url: string | null; is_edited: boolean; updated_at: string }): void;
}>();
</script>

<style scoped>
.no-posts-message {
  text-align: center;
  padding: 2rem;
  color: #777;
  font-style: italic;
  background-color: var(--card-bg);
  border-radius: 8px;
}
.loading-more-posts {
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 1.5rem;
  color: #555;
}
</style>
