<template>
  <article :id="`comment-${comment.id}`" class="comment-item">
    <header class="comment-header">
      <div class="author-info">
        <img :src="authorAvatarUrl" alt="Avatar do autor" class="author-avatar" />
        <div>
          <span class="author-name">{{ comment.author_username || (comment.is_anonymous ? 'Anônimo' : 'Usuário') }}</span>
          <span class="comment-timestamp">{{ timeAgo(comment.created_at) }} <span v-if="comment.is_edited">(editado)</span></span>
        </div>
      </div>
      <!-- Opções do comentário -->
    </header>

    <div class="comment-content">
      <div v-if="comment.reply_to_info" class="reply-to-info">
        Em resposta a
        <a :href="`#comment-${comment.reply_to_info.id}`" @click.prevent="scrollToParentComment(comment.reply_to_info.id)">
          {{ comment.reply_to_info.author_username || 'Anônimo' }}
        </a>:
        <blockquote class="parent-comment-excerpt">{{ truncateText(comment.reply_to_info.text_content, 50) }}</blockquote>
      </div>
      <p v-if="comment.text_content" class="text-content" v-html="formattedTextContent"></p>
      <!-- Mídia do comentário (imagem/vídeo) - similar ao PostItem -->
    </div>

    <footer class="comment-footer">
      <!-- Ações: Like, Dislike, Responder -->
      <button @click="handleVote(1)" :class="{'active': currentUserVote === 1}">Like ({{ localLikesCount }})</button>
      <button @click="handleVote(-1)" :class="{'active': currentUserVote === -1}">Dislike ({{ localDislikesCount }})</button>
      <button @click="showReplyForm = !showReplyForm">Responder</button>
    </footer>

    <!-- Formulário de Resposta (componente CreateCommentForm a ser criado) -->
    <div v-if="showReplyForm" class="reply-form-container">
      <!-- <CreateCommentForm :post-id="comment.post_id" :reply-to-comment-id="comment.id" @comment-posted="handleReplyPosted" /> -->
      <p>Formulário de resposta aqui...</p>
    </div>

    <!-- Lista de Respostas (Comentários aninhados - recursivo ou nova lista) -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
      <!-- <CommentList :comments="comment.replies" :post-id="comment.post_id" :is-reply-list="true" /> -->
      <p>Respostas aqui...</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { DisplayComment } from '~/types/app'; // Precisaremos definir este tipo
import { useToast } from 'vue-toastification';

const props = defineProps<{
  comment: DisplayComment;
  postId: string; // ID do post pai, para o formulário de resposta
}>();

const emit = defineEmits(['reply-posted-to-list']); // Para atualizar lista de respostas na página

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const toast = useToast();

const defaultUserAvatar = '/images/default-avatar.png';
const showReplyForm = ref(false);

// Estado local para votos e contagens (similar ao PostItem)
const currentUserVote = ref<number | null>(null);
const localLikesCount = ref(props.comment.likes_count || 0);
const localDislikesCount = ref(props.comment.dislikes_count || 0);

const authorAvatarUrl = computed(() => {
  const path = props.comment.author_avatar_path;
  if (path) return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars/${path}`;
  return defaultUserAvatar;
});

const formattedTextContent = computed(() => {
  if (!props.comment.text_content) return '';
  return props.comment.text_content.replace(/\n/g, '<br />')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
});

function timeAgo(timestamp: string): string { /* ... (mesma função timeAgo do PostItem) ... */ return new Date(timestamp).toLocaleDateString(); }
function truncateText(text: string | null, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function scrollToParentComment(parentId: string) {
  const parentElement = document.getElementById(`comment-${parentId}`);
  if (parentElement) {
    parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Adicionar um destaque temporário
    parentElement.classList.add('highlighted-comment');
    setTimeout(() => parentElement.classList.remove('highlighted-comment'), 2000);
  }
}

// Lógica de Voto (handleVote) - MUITO SIMILAR ao PostItem, mas com target_type: 'comment'
async function handleVote(newVoteType: 1 | -1) {
  if (!user.value) { /* ... toast ... */ return; }
  const oldVote = currentUserVote.value;
  // Atualiza UI localmente...
  if (oldVote === newVoteType) { currentUserVote.value = null; /* ajusta contagens locais */ }
  else { currentUserVote.value = newVoteType; /* ajusta contagens locais */ }

  try {
    if (oldVote === newVoteType) { /* ... supabase.from('votes').delete()... .eq('target_type', 'comment') ... */ }
    else if (oldVote !== null) { /* ... supabase.from('votes').update()... .eq('target_type', 'comment') ... */ }
    else { /* ... supabase.from('votes').insert({ ... target_type: 'comment' ... }) ... */ }
  } catch (e: any) { /* ... toast e reverter UI local ... */ }
}
// ... (fetchCurrentUserVote - similar ao PostItem, mas para target_type 'comment')

function handleReplyPosted(newReply: DisplayComment) {
    showReplyForm.value = false;
    // Idealmente, o componente pai (PostItem ou CommentList mais acima) lida com adicionar a reply
    // à lista correta para evitar complexidade de estado profundo.
    // Ou, se CommentItem gerencia suas próprias replies, adiciona aqui.
    emit('reply-posted-to-list', newReply); // Notifica o pai
}

// Fetch do voto atual e contagens no onMounted e watch(user)
onMounted(() => { /* ... fetchCurrentUserVote ... */ });
watch(user, () => { /* ... fetchCurrentUserVote ... */});
watchEffect(() => {
  localLikesCount.value = props.comment.likes_count || 0;
  localDislikesCount.value = props.comment.dislikes_count || 0;
});

</script>

<style scoped>
.comment-item {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: transparent; /* Diferente do card-style para aninhamento */
}
.comment-item:last-child {
  border-bottom: none;
}
/* Adicionar :target para o highlight do scroll */
.comment-item.highlighted-comment {
  background-color: var(--primary-color-light) !important;
  transition: background-color 0.5s ease-out;
}


.comment-header { /* ... similar ao post-header ... */ }
.author-info { display: flex; align-items: center; gap: 0.75rem; }
.author-avatar { width: 32px; height: 32px; border-radius: 50%; }
.author-name { font-weight: 600; }
.comment-timestamp { font-size: 0.75rem; color: #777; margin-left: 0.5rem; }

.comment-content { margin-top: 0.5rem; margin-left: calc(32px + 0.75rem); /* Alinhar com texto do autor */ }
.reply-to-info {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.5rem;
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid var(--border-color);
}
.reply-to-info a {
  font-weight: 500;
  color: var(--primary-color);
}
.parent-comment-excerpt {
  display: block;
  margin-top: 0.25rem;
  padding-left: 0.5rem;
  font-style: italic;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-content { line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
.text-content :deep(a) { color: var(--primary-color); text-decoration: underline;}

.comment-footer {
  margin-top: 0.75rem;
  margin-left: calc(32px + 0.75rem);
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}
.comment-footer button {
  background: none; border: none; color: #555; cursor: pointer; padding: 0.25rem 0;
}
.comment-footer button:hover { color: var(--primary-color); }
.comment-footer button.active { color: var(--primary-color); font-weight: bold; }

.reply-form-container {
  margin-top: 1rem;
  margin-left: calc(32px + 0.75rem);
  padding-left: 1rem;
  border-left: 2px solid var(--border-color);
}
.replies-list {
  margin-top: 1rem;
  margin-left: calc(32px + 0.75rem);
}
</style>