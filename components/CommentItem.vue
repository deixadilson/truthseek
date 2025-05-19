<template>
  <div :id="`comment-${comment.id}`" class="comment-item" :class="{ 'is-reply': !!comment.reply_to, 'highlighted': isHighlighted }">
    <div class="comment-main-content">
      <img :src="authorAvatarUrl" alt="Avatar" class="author-avatar-small" />
      <div class="comment-body">
        <div class="comment-author-line">
          <span class="comment-author-name">
            {{ comment.is_anonymous ? 'Anônimo' : (comment.author_username || 'Usuário') }}
          </span>
          <span v-if="comment.created_at" class="comment-timestamp">
            {{ timeAgo(comment.created_at) }} <span v-if="comment.is_edited">(editado)</span>
          </span>
          <span v-else class="comment-timestamp">
            Data indisponível
          </span>
        </div>

        <div v-if="comment.reply_to && repliedToUsername" class="reply-info">
          Em resposta a
          <a @click.prevent="emitScrollToReply(comment.reply_to!)" href="#" title="Ir para o comentário respondido">
            @{{ repliedToUsername }}
          </a>
        </div>

        <div v-if="comment.text_content" class="comment-text" v-html="formatTextToHtml(comment.text_content)"></div>
        <div v-if="comment.image_path" class="comment-media">
          <img :src="commentImageUrl" alt="Imagem do comentário" />
        </div>
        <div v-if="comment.video_url && commentEmbedVideoUrl" class="comment-media">
          <iframe :src="commentEmbedVideoUrl || undefined" frameborder="0" allowfullscreen></iframe>
        </div>

        <footer class="comment-footer">
          <button @click="handleVote(1)" class="action-btn" :class="{ 'active': currentUserVote === 1 }" title="Gostei">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="currentUserVote === 1 ? 'var(--primary-color)' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            <span>{{ localLikesCount }}</span>
          </button>
          <button @click="handleVote(-1)" class="action-btn" :class="{ 'active': currentUserVote === -1 }" title="Não gostei">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="currentUserVote === -1 ? 'var(--primary-color)' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
            <span>{{ localDislikesCount }}</span>
          </button>
          <button @click="emitReply" class="action-btn reply-btn-action" title="Responder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            <span>Responder</span>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { CommentWithAuthor } from '~/types/app';
import { useToast } from 'vue-toastification';
import { timeAgo, formatTextToHtml, getEmbedVideoUrl } from '~/utils/formatters';

const props = defineProps<{
  comment: CommentWithAuthor;
  repliedToUsername?: string | null;
  isHighlighted?: boolean;
}>();

const emit = defineEmits<{
  (e: 'request-reply', payload: { commentId: string; username: string | null }): void;
  (e: 'scroll-to-comment', commentId: string): void;
  (e: 'vote-updated', payload: { commentId: string, likes: number, dislikes: number, userVote: number | null }): void;
}>();

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const toast = useToast();

const defaultUserAvatar = '/images/default-avatar.png';

const currentUserVote = ref<number | null>(null);
const localLikesCount = ref(props.comment.likes_count || 0);
const localDislikesCount = ref(props.comment.dislikes_count || 0);

const authorAvatarUrl = computed(() => {
  return props.comment.author_avatar_path
    ? `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars/${props.comment.author_avatar_path}`
    : defaultUserAvatar;
});

const commentImageUrl = computed(() => {
  if (props.comment.image_path) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/comment-media/${props.comment.image_path}`; // Assumindo bucket 'comment-media'
  }
  return '';
});

const commentEmbedVideoUrl = computed(() => getEmbedVideoUrl(props.comment.video_url));

async function fetchCurrentUserVoteForComment() {
  if (!user.value || !props.comment.id) {
    currentUserVote.value = null;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('user_id', user.value.id)
      .eq('target_id', props.comment.id)
      .eq('target_type', 'comment')
      .maybeSingle();

    if (error) throw error;
    currentUserVote.value = data ? data.vote_type : null;
  } catch (e: any) {
    console.error("Erro ao buscar voto do usuário no comentário:", e.message);
  }
}

watchEffect(() => {
  localLikesCount.value = props.comment.likes_count || 0;
  localDislikesCount.value = props.comment.dislikes_count || 0;
});

onMounted(() => {
  fetchCurrentUserVoteForComment();
});

watch(user, () => {
  fetchCurrentUserVoteForComment();
});

async function handleVote(newVoteType: 1 | -1) {
  if (!user.value || !user.value.id || !props.comment.id) {
    return;
  }

  const oldVote = currentUserVote.value;
  let optimisticLikes = localLikesCount.value;
  let optimisticDislikes = localDislikesCount.value;

  if (oldVote === newVoteType) { // Desfazendo o voto
    currentUserVote.value = null;
    if (newVoteType === 1) optimisticLikes = Math.max(0, optimisticLikes - 1);
    else optimisticDislikes = Math.max(0, optimisticDislikes - 1);
  } else { // Novo voto ou mudando
    if (oldVote === 1) optimisticLikes = Math.max(0, optimisticLikes - 1);
    else if (oldVote === -1) optimisticDislikes = Math.max(0, optimisticDislikes - 1);

    currentUserVote.value = newVoteType;
    if (newVoteType === 1) optimisticLikes++;
    else optimisticDislikes++;
  }
  localLikesCount.value = optimisticLikes;
  localDislikesCount.value = optimisticDislikes;
  
  try {
    if (oldVote === newVoteType ) {
      await supabase.from('votes').delete().match({ user_id: user.value.id, target_id: props.comment.id, target_type: 'comment' });
    } else if (oldVote !== null) {
      await supabase.from('votes').update({ vote_type: newVoteType }).match({ user_id: user.value.id, target_id: props.comment.id, target_type: 'comment' });
    } else {
      await supabase.from('votes').insert({ user_id: user.value.id, target_id: props.comment.id, target_type: 'comment', vote_type: newVoteType });
    }
    emit('vote-updated', { commentId: props.comment.id, likes: optimisticLikes, dislikes: optimisticDislikes, userVote: currentUserVote.value });
  } catch (e: any) {
    console.error('Erro ao votar no comentário:', e);
    toast.error(e.message || 'Falha ao registrar voto.');
    // Reverter UI otimista
    currentUserVote.value = oldVote;
    // Para reverter contagens, precisaríamos das contagens originais do props.comment
    localLikesCount.value = props.comment.likes_count || 0;
    localDislikesCount.value = props.comment.dislikes_count || 0;
    fetchCurrentUserVoteForComment(); // Re-sincroniza o estado do voto do usuário
  }
}

function emitReply() {
  if (!props.comment.id) return;
  emit('request-reply', { commentId: props.comment.id, username: props.comment.is_anonymous ? 'Anônimo' : (props.comment.author_username || 'Usuário') });
}

function emitScrollToReply(commentId: string) {
  emit('scroll-to-comment', commentId);
}
</script>

<style scoped>
.comment-item {
  display: flex; /* Para alinhar avatar e corpo do comentário */
  gap: 0.75rem;
  padding: 1rem 0.5rem; /* Ajustado padding */
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.5s ease-out;
}
.comment-item:last-child { border-bottom: none; }
.comment-item.highlighted { background-color: color-mix(in srgb, var(--primary-color) 10%, transparent); }

.author-avatar-small {
  width: 36px; height: 36px; /* Levemente maior */
  border-radius: 50%; object-fit: cover; background-color: #eee;
  flex-shrink: 0; /* Para não encolher */
}

.comment-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.comment-author-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.comment-author-name { font-weight: 600; font-size: 0.9rem; }
.comment-timestamp { font-size: 0.75rem; color: #777; }

.reply-info { font-size: 0.8rem; color: #666; margin-bottom: 0.3rem; }
.reply-info a { color: var(--primary-color); cursor: pointer; text-decoration: none; }
.reply-info a:hover { text-decoration: underline; }

.comment-text {
  font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;
  margin-bottom: 0.75rem;
}
.comment-text :deep(a) { color: var(--primary-color); text-decoration: underline; }

.comment-media { margin-bottom: 0.75rem; }
.comment-media img { max-width: 100%; max-height: 250px; border-radius: 4px; }
.comment-media iframe { width: 100%; max-height: 250px; aspect-ratio: 16 / 9; border-radius: 4px; }


.comment-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}
.action-btn {
  background: none; border: none; cursor: pointer; color: #555;
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.4rem; border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}
.action-btn:hover { background-color: var(--primary-color-light); color: var(--primary-color-dark); }
.action-btn.active { color: var(--primary-color-dark); font-weight: bold; }
.action-btn.active svg { fill: var(--primary-color) !important; }.action-btn span { font-size: 0.8rem; }
</style>
