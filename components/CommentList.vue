<template>
  <div class="comment-list-section" :class="{ 'reply-list-style': isReplyList }">
    <h4 v-if="!isReplyList && title">{{ title }}</h4>
    <div v-if="comments.length === 0 && !isLoading" class="no-comments-message">
      <p>{{ emptyMessage || 'Nenhum comentário ainda.' }}</p>
    </div>
    <CommentItem
      v-for="comment in comments"
      :key="comment.id"
      :comment="comment"
      :post-id="postId"
      @reply-posted-to-list="handleReplyInList"
    />
    <div v-if="isLoading" class="loading-comments">
      Carregando comentários...
    </div>
    <!-- Paginação ou botão "Carregar mais" viria aqui -->
  </div>
</template>

<script setup lang="ts">
import type { DisplayComment } from '~/types/app';

const props = defineProps<{
  comments: DisplayComment[];
  postId: string; // Para passar ao CreateCommentForm dentro de CommentItem
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  isReplyList?: boolean; // Para estilização diferente se for uma lista de respostas
}>();

const emit = defineEmits(['new-reply-added']); // Para propagar o evento de nova resposta

function handleReplyInList(newReply: DisplayComment) {
  // Este componente (CommentList) não deve modificar diretamente o array 'comments' que vem do pai.
  // Ele propaga o evento para o componente pai (ex: PostItem ou a página do grupo)
  // que é responsável por gerenciar o estado da lista de comentários principal.
  emit('new-reply-added', newReply);
}
</script>

<style scoped>
.comment-list-section {
  margin-top: 1.5rem;
}
.comment-list-section h4 {
  font-size: 1.2rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}
.no-comments-message, .loading-comments {
  text-align: center;
  padding: 1rem;
  color: #777;
  font-style: italic;
}
</style>