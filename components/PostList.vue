<!-- components/PostList.vue -->
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
// import PostItem from './PostItem.vue'; // Auto-importado pelo Nuxt
// import type { Post } from './PostItem.vue'; // Importar o tipo Post se definido em PostItem ou em um arquivo de tipos separado

// Definir o tipo Post novamente aqui ou importá-lo
// (Idealmente, ter um arquivo central de tipos)
interface PostListItem extends Post {} // Reutilizar ou redefinir o tipo Post

defineProps<{
  posts: PostListItem[];
  isLoading?: boolean; // Para mostrar loading ao carregar mais
  emptyMessage?: string;
}>();
</script>

<style scoped>
.post-list {
  /* Estilos para o container da lista, se necessário */
}
.no-posts-message {
  text-align: center;
  padding: 2rem;
  color: #777;
  font-style: italic;
  background-color: var(--card-bg); /* Para consistência com os posts */
  border-radius: 8px;
}
.loading-more-posts {
  text-align: center;
  padding: 1.5rem;
  color: #555;
}
</style>
