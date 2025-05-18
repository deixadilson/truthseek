<template>
  <div class="post-list">
    <div v-if="posts.length === 0 && !isLoading" class="no-posts-message">
      <p>{{ emptyMessage || 'Nenhuma postagem para exibir ainda.' }}</p>
    </div>
    <PostItem
      v-for="post in posts"
      :key="post.id"
      :post="post"
    />
    <div v-if="isLoading" class="loading-more-posts">
      Carregando mais posts...
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DisplayPost } from '~/types/app';

defineProps<{
  posts: DisplayPost[];
  isLoading?: boolean;
  emptyMessage?: string;
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
  text-align: center;
  padding: 1.5rem;
  color: #555;
}
</style>
