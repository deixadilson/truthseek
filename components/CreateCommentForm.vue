<template>
  <div class="create-comment-form-component">
    <p v-if="replyToCommentId && replyToUsername" class="replying-to-text">
      Respondendo a @{{ replyToUsername }}
      <button @click="cancelReplyInternal" class="cancel-reply-btn" title="Cancelar resposta">×</button>
    </p>
    <form @submit.prevent="submitCommentInternal">
      <textarea
        v-model="commentText"
        :placeholder="replyToCommentId ? 'Escreva sua resposta...' : 'Escreva um comentário...'"
        rows="3"
        ref="commentTextareaRef"
      ></textarea>
      <!-- Futuramente: adicionar inputs para imagem/vídeo no comentário aqui -->
      <div class="comment-actions-toolbar">
        <div class="comment-options">
          <label title="Comentar anonimamente">
            <input type="checkbox" v-model="isAnonymous" />
            <span class="checkbox-label">Anônimo</span>
          </label>
          <!-- Outras opções de comentário aqui, se houver -->
        </div>
        <button type="submit" :disabled="isSubmitting || !commentText.trim()" class="button-primary submit-comment-btn">
          {{ isSubmitting ? 'Enviando...' : (replyToCommentId ? 'Responder' : 'Comentar') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { CommentWithAuthor, Profile } from '~/types/app';
import { useUserProfileState } from '~/composables/useUserProfile';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  postId: string;
  replyToCommentId?: string | null;
  replyToUsername?: string | null;
}>();

const emit = defineEmits<{
  (e: 'comment-created', comment: CommentWithAuthor): void;
  (e: 'reply-cancelled'): void;
}>();

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const userProfile = useUserProfileState();
const toast = useToast();

const commentText = ref('');
const isAnonymous = ref(false);
const isSubmitting = ref(false);

const commentTextareaRef = ref<HTMLTextAreaElement | null>(null);

// Se estiver respondendo, focar no textarea
watch(() => props.replyToCommentId, (newVal) => {
  if (newVal && commentTextareaRef.value) {
    commentTextareaRef.value.focus();
  }
}, { immediate: true });

function resetForm() {
  commentText.value = '';
  isAnonymous.value = false;
  // Não resetamos props.replyToCommentId aqui, o pai controla isso
}

function cancelReplyInternal() {
  resetForm();
  emit('reply-cancelled');
}

async function submitCommentInternal() {
  if (!user.value || !userProfile.value) {
    toast.error('Você precisa estar logado e seu perfil carregado para comentar.');
    return;
  }
  if (!commentText.value.trim()) {
    toast.warning('O comentário não pode estar vazio.');
    return;
  }

  isSubmitting.value = true;
  try {
    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert({
        post_id: props.postId,
        author_id: user.value.id,
        text_content: commentText.value.trim(),
        is_anonymous: isAnonymous.value,
        reply_to: props.replyToCommentId || null
      })
      .select('*')
      .single();

    if (error) throw error;

    if (newCommentData) {
      const optimisticComment: CommentWithAuthor = {
        ...newCommentData,
        author_username: newCommentData.is_anonymous ? null : (userProfile.value?.username || user.value.email?.split('@')[0] || 'Usuário'),
        author_avatar_path: newCommentData.is_anonymous ? null : (userProfile.value?.avatar_path || null)
      };

      emit('comment-created', optimisticComment);
      resetForm();
      if(props.replyToCommentId) {
        emit('reply-cancelled');
      }
    }
  } catch (e: any) {
    console.error("Erro ao enviar comentário/resposta:", e);
    toast.error(e.message || 'Falha ao enviar.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.replying-to-text {
    font-size: 0.9rem;
    color: #555;
    margin-bottom: 0.5rem;
    background-color: var(--primary-color-light);
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.cancel-reply-btn {
    background: none; border: none; color: var(--primary-color); font-size: 1.3rem; cursor: pointer;
    padding: 0 0.3rem; line-height: 1;
}
.cancel-reply-btn:hover { color: var(--primary-color-dark); }

textarea {
  width: 100%; min-height: 70px; padding: 0.75rem;
  border: 1px solid var(--border-color); border-radius: 4px;
  font-family: inherit; font-size: 0.95rem; line-height: 1.5; margin-bottom: 0.75rem;
}
textarea:focus {
  outline: none; border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.comment-actions-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}
.comment-options { display: flex; gap: 1rem; font-size: 0.85rem; }
.comment-options label { display: flex; align-items: center; gap: 0.3rem; cursor: pointer; }

.submit-comment-btn {
  font-size: 0.9rem;
  padding: 0.5em 1.2em;
}
</style>