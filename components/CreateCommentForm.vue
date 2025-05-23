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
          <label for="comment-hidden-file-input" class="button-like-label button-tertiary add-image-btn" title="Adicionar Imagem ao Comentário">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
              <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
            </svg>
            <span class="btn-text-optional">Imagem</span>
          </label>
          <input
            type="file" id="comment-hidden-file-input" @change="handleImageFileSelected"
            accept="image/*" style="display: none" ref="commentFileInputRef"
          />
          <div class="comment-options">
            <label title="Comentar anonimamente">
              <input type="checkbox" v-model="isAnonymous" />
              <span class="checkbox-label">Anônimo</span>
            </label>
          </div>
        </div>

        <button type="submit" :disabled="isSubmitting || !commentText.trim() && !imageFile && !videoUrlToSave" class="button-primary submit-comment-btn">
          {{ isSubmitting ? 'Enviando...' : (replyToCommentId ? 'Responder' : 'Comentar') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { CommentWithAuthor, Profile } from '~/types/app';
import { useProfile } from '~/composables/useUserProfile';
import { useToast } from 'vue-toastification';
import { getEmbedVideoUrl, isValidImageUrl } from '~/utils/formatters';

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
const userProfile = useProfile();
const toast = useToast();

const commentText = ref('');
const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const videoUrlToSave = ref<string | null>(null);
const embedVideoUrl = ref<string | null>(null);
const isAnonymous = ref(false);
const isSubmitting = ref(false);
const isDraggingOver = ref(false);

const commentTextareaRef = ref<HTMLTextAreaElement | null>(null);
const commentFileInputRef = ref<HTMLInputElement | null>(null);

const canSubmit = computed(() => {
  return commentText.value.trim() !== '' || imageFile.value !== null || videoUrlToSave.value !== null;
});

function processPastedOrDroppedMedia(data: string | File) {
  if (typeof data === 'string') {
    const potentialVideoEmbedUrl = getEmbedVideoUrl(data);
    if (potentialVideoEmbedUrl) {
      if (imageFile.value) {
        toast.warning('Remova a imagem antes de adicionar um vídeo ao comentário.');
        return;
      }
      embedVideoUrl.value = potentialVideoEmbedUrl;
      videoUrlToSave.value = data;
      commentText.value = commentText.value.replace(data, '').trim();
    } else if (isValidImageUrl(data)) {
      toast.info('Para adicionar uma imagem de um link, use o botão "Imagem" ou arraste e solte o arquivo.');
    }
  } else {
    if (videoUrlToSave.value) {
      toast.warning('Remova o vídeo antes de adicionar uma imagem ao comentário.');
      return;
    }
    imageFile.value = data;
    imagePreviewUrl.value = URL.createObjectURL(data);
  }
}

function handlePaste(event: ClipboardEvent) {
  const pastedText = event.clipboardData?.getData('text');
  if (pastedText) {
    setTimeout(() => { processPastedOrDroppedMedia(pastedText); }, 0);
  }
  const items = event.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          if (videoUrlToSave.value) { toast.warning('Remova o vídeo antes de colar uma imagem.'); return; }
          imageFile.value = blob;
          imagePreviewUrl.value = URL.createObjectURL(blob);
          event.preventDefault(); break;
        }
      }
    }
  }
}

function handleImageFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) { processPastedOrDroppedMedia(target.files[0]); }
}
function handleDragOver() { isDraggingOver.value = true; }
function handleDragLeave() { isDraggingOver.value = false; }
function handleDrop(event: DragEvent) {
  isDraggingOver.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    if (event.dataTransfer.files[0].type.startsWith('image/')) {
      processPastedOrDroppedMedia(event.dataTransfer.files[0]);
    } else { toast.error('Apenas arquivos de imagem podem ser arrastados.'); }
  }
}
function removeImage() {
  imageFile.value = null; imagePreviewUrl.value = null;
  if (commentFileInputRef.value) commentFileInputRef.value.value = '';
}
function removeVideo() { embedVideoUrl.value = null; videoUrlToSave.value = null; }

function resetForm() {
  commentText.value = '';
  removeImage(); removeVideo();
  isAnonymous.value = false;
}

function cancelReply() {
  resetForm();
  emit('reply-cancelled');
}

async function submitComment() {
  if (!canSubmit.value) return;
  if (!user.value || !userProfile.value) return;
  if (!commentText.value.trim()) return;
  if (imageFile.value && videoUrlToSave.value) return;

  isSubmitting.value = true;
  let imagePathToSave: string | null = null;

  try {
    if (imageFile.value) {
      const file = imageFile.value;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${user.value.id}_${Date.now()}.${fileExt}`;
      const filePath = `public/${props.postId}/${fileName}`;

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
        author_id: user.value.id,
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

// Se estiver respondendo, focar no textarea
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
  gap: 1rem;
  flex-grow: 1;
}

.button-like-label.add-image-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.4em 0.7em;
  cursor: pointer;
}
.button-like-label.add-image-btn .btn-text-optional {
  font-size: 0.85rem;
  margin-left: 0.3em;
}

.comment-options { display: flex; gap: 1rem; font-size: 0.85rem; }
.comment-options label { display: flex; align-items: center; gap: 0.3rem; cursor: pointer; }

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

.add-image-btn {
  padding: 0.4em 0.7em;
}
.add-image-btn .btn-text-optional { /* Mostrar/esconder texto baseado no espaço */
  font-size: 0.85rem;
  margin-left: 0.3em;
}
@media (max-width: 400px) {
  .add-image-btn .btn-text-optional { display: none; }
}
</style>