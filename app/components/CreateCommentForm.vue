<template>
  <div class="create-comment-form-component">
    <p v-if="replyToCommentId && replyToUsername" class="replying-to-text">
      Respondendo a @{{ replyToUsername }}
      <button @click="cancelReply" class="cancel-reply-btn" title="Cancelar resposta">×</button>
    </p>
    <form @submit.prevent="submitComment">
      <textarea
        v-model="commentText"
        :placeholder="replyToCommentId ? 'Escreva sua resposta...' : 'Escreva um comentário... Cole um link de vídeo ou uma imagem aqui.'"
        rows="3"
        ref="commentTextareaRef"
        @paste="handlePaste"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="{ 'drag-over': isDraggingOver }"
      ></textarea>
      <div v-if="imagePreviewUrl || embedVideoUrl" class="media-preview-container form-group">
        <div v-if="imagePreviewUrl" class="image-preview">
          <img :src="imagePreviewUrl" alt="Pré-visualização da imagem" />
          <button type="button" @click="removeImage" class="remove-media-btn">×</button>
        </div>
        <div v-if="embedVideoUrl" class="video-preview">
          <iframe :src="embedVideoUrl || undefined" frameborder="0" allowfullscreen></iframe>
          <button type="button" @click="removeVideo" class="remove-media-btn">×</button>
        </div>
      </div>
      <div class="comment-actions-toolbar">
        <div class="left-actions">
          <label for="comment-hidden-file-input" class="toolbar-action-btn button-tertiary add-image-btn" title="Adicionar Imagem ao Comentário">
            <Icon name="lucide:image" :size="16" />
            <span class="btn-text-optional">Imagem</span>
          </label>
          <input
            type="file" id="comment-hidden-file-input" @change="handleImageFileSelected"
            accept="image/*" style="display: none" ref="fileInputRef"
          />
          <OptionToggle
            v-model="isAnonymous"
            label="Anônimo"
            icon="lucide:hat-glasses"
            title="Comentar anonimamente"
          />
        </div>

        <button type="submit" :disabled="isSubmitting || !canSubmit" class="button-primary submit-comment-btn">
          <LoadingMessage v-if="isSubmitting" message="Enviando..." :icon-size="16" />
          <template v-else>{{ replyToCommentId ? 'Responder' : 'Comentar' }}</template>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { CommentWithAuthor } from '~/types/app';
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
const authUserId = useAuthUserId();
const userProfile = useProfile();
const toast = useToast();

const commentText = ref('');
const isAnonymous = ref(false);
const isSubmitting = ref(false);
const commentTextareaRef = ref<HTMLTextAreaElement | null>(null);

const {
  imageFile,
  imagePreviewUrl,
  videoUrlToSave,
  embedVideoUrl,
  isDraggingOver,
  fileInputRef,
  removeImage,
  removeVideo,
  resetMedia,
  handlePaste,
  handleImageFileSelected,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  canSubmitWith,
} = useMediaAttachment(commentText);

const canSubmit = computed(() => canSubmitWith());

function resetForm() {
  commentText.value = '';
  resetMedia();
  isAnonymous.value = false;
}

function cancelReply() {
  resetForm();
  emit('reply-cancelled');
}

async function submitComment() {
  if (!canSubmit.value) return;
  if (!authUserId.value || !userProfile.value) return;
  if (!commentText.value.trim() && !imageFile.value && !videoUrlToSave.value) return;

  isSubmitting.value = true;
  let imagePathToSave: string | null = null;

  try {
    if (imageFile.value) {
      const file = imageFile.value;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${authUserId.value}_${Date.now()}.${fileExt}`;
      const filePath = `${props.postId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comment-media')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;
      if (uploadData) imagePathToSave = uploadData.path;
    }

    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert({
        post_id: props.postId,
        author_id: authUserId.value,
        text_content: commentText.value.trim() || null,
        image_path: imagePathToSave,
        video_url: videoUrlToSave.value,
        is_anonymous: isAnonymous.value,
        reply_to: props.replyToCommentId || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    if (newCommentData) {
      toast.success(props.replyToCommentId ? 'Resposta enviada!' : 'Comentário enviado!');
      const optimisticComment: CommentWithAuthor = {
        ...newCommentData,
        author_username: newCommentData.is_anonymous ? null : (userProfile.value?.username || user.value.email?.split('@')[0] || 'Usuário'),
        author_avatar_path: newCommentData.is_anonymous ? null : (userProfile.value?.avatar_path || null)
      };
      emit('comment-created', optimisticComment);
      resetForm();
      if(props.replyToCommentId) { emit('reply-cancelled'); }
    }
  } catch (e: any) {
    console.error("Erro ao enviar comentário:", e);
    toast.error(e.message || 'Falha ao enviar.');
  } finally {
    isSubmitting.value = false;
  }
}

watch(() => props.replyToCommentId, (newVal) => {
  if (newVal && commentTextareaRef.value) {
    commentTextareaRef.value.focus();
  }
}, { immediate: true });
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

.form-group {
  margin-bottom: 0.75rem;
}
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
.left-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-grow: 1;
}

.toolbar-action-btn.add-image-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 2.25rem;
  padding: 0 0.75em;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  box-sizing: border-box;
  cursor: pointer;
}

.submit-comment-btn {
  font-size: 0.9rem;
  padding: 0.5em 1.2em;
}

.media-preview-container {
  border: 1px dashed var(--border-color); padding: 0.75rem; margin-bottom:0.75rem;
  border-radius: 4px; position: relative;
}
.image-preview img { max-width: 100%; max-height: 200px; display: block; margin: 0 auto; border-radius: 4px; }
.video-preview iframe { width: 100%; aspect-ratio: 16 / 9; max-height:200px; border-radius: 4px; }
.remove-media-btn {
  position: absolute; top: 3px; right: 3px; background-color: rgba(0,0,0,0.5); color: white;
  border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 14px;
  line-height: 18px; cursor: pointer; padding: 0;
}
.remove-media-btn:hover { background-color: rgba(0,0,0,0.7); }

@media (max-width: 400px) {
  .add-image-btn .btn-text-optional { display: none; }
}
</style>