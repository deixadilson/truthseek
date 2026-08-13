<template>
  <div :id="`comment-${comment.id}`" class="comment-item" :class="{ 'is-reply': !!comment.reply_to, 'highlighted': isHighlighted }">
    <div class="comment-main-content">
      <img :src="authorAvatarUrl" alt="Avatar" class="author-avatar-small" />
      <div class="comment-body">
        <div class="comment-top-row">
          <AuthorPopover
            :author-id="comment.author_id"
            :context-group-id="postOwnerGroupId"
            :author-username="comment.author_username"
            :hide-trigger-arrow="true"
            v-if="comment.author_id && !comment.is_anonymous"
          >
            <div class="comment-author-line">
              <span class="comment-author-name">
                {{ comment.is_anonymous ? 'Anônimo' : (comment.author_username || 'Usuário') }}
              </span>
              <span v-if="comment.created_at" class="comment-timestamp">
                {{ timeAgo(comment.created_at) }}
                <template v-if="localIsEdited">
                  ·
                  <EditedHistoryLink
                    v-if="comment.id"
                    target-type="comment"
                    :target-id="comment.id"
                    media-bucket="comment-media"
                  />
                </template>
              </span>
              <span v-else class="comment-timestamp">Data indisponível</span>
            </div>
          </AuthorPopover>
          <div v-else class="comment-author-line">
            <span class="comment-author-name">
              {{ comment.is_anonymous ? 'Anônimo' : (comment.author_username || 'Usuário') }}
            </span>
            <span v-if="comment.created_at" class="comment-timestamp">
              {{ timeAgo(comment.created_at) }}
              <template v-if="localIsEdited">
                ·
                <EditedHistoryLink
                  v-if="comment.id"
                  target-type="comment"
                  :target-id="comment.id"
                  media-bucket="comment-media"
                />
              </template>
            </span>
          </div>

          <ContentOptionsMenu
            v-if="comment.id && showOptionsMenu"
            :can-edit="isAuthor"
            :can-delete="isAuthor"
            :can-report="canReport"
            :disabled="isBusy"
            @edit="startEdit"
            @delete="confirmDelete"
            @report="openReportDialog"
          />
        </div>

        <div v-if="comment.reply_to && repliedToUsername" class="reply-info">
          Em resposta a
          <a @click.prevent="emitScrollToReply(comment.reply_to!)" href="#" title="Ir para o comentário respondido">
            @{{ repliedToUsername }}
          </a>
        </div>

        <form v-if="isEditing" class="edit-form" @submit.prevent="saveEdit">
          <textarea
            v-model="editText"
            rows="3"
            class="edit-textarea"
            maxlength="5000"
            placeholder="Edite o texto. Cole um link de YouTube/Vimeo ou uma imagem para substituir a mídia."
            @paste="handlePaste"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            :class="{ 'drag-over': isDraggingOver }"
          ></textarea>

          <div v-if="imagePreviewUrl || editEmbedVideoUrl" class="media-preview-container">
            <div v-if="imagePreviewUrl" class="image-preview">
              <img :src="imagePreviewUrl" alt="Pré-visualização da imagem" />
              <button type="button" class="remove-media-btn" @click="removeImage">×</button>
            </div>
            <div v-if="editEmbedVideoUrl" class="video-preview">
              <iframe :src="editEmbedVideoUrl" frameborder="0" allowfullscreen></iframe>
              <button type="button" class="remove-media-btn" @click="removeVideo">×</button>
            </div>
          </div>

          <div class="edit-actions">
            <label class="button-secondary toolbar-action-btn add-image-btn" title="Adicionar ou substituir imagem">
              <Icon name="lucide:image" :size="16" />
              Imagem
              <input
                type="file"
                accept="image/*"
                style="display: none"
                ref="fileInputRef"
                @change="handleImageFileSelected"
              />
            </label>
            <div class="edit-actions-right">
              <button type="button" class="button-secondary" :disabled="isBusy" @click="cancelEdit">
                Cancelar
              </button>
              <button type="submit" class="button-primary" :disabled="isBusy || !canSaveEdit">
                <LoadingMessage v-if="isBusy" message="Salvando..." :icon-size="14" />
                <template v-else>Salvar</template>
              </button>
            </div>
          </div>
        </form>
        <template v-else>
          <div v-if="localTextContent" class="comment-text" v-html="formatTextToHtml(localTextContent)"></div>
          <div v-if="localImagePath" class="comment-media">
            <img :src="commentImageUrl" alt="Imagem do comentário" />
          </div>
          <div v-if="localVideoUrl && commentEmbedVideoUrl" class="comment-media">
            <iframe :src="commentEmbedVideoUrl || undefined" frameborder="0" allowfullscreen></iframe>
          </div>
        </template>

        <footer class="comment-footer">
          <button @click="handleVote(1)" class="action-btn" :class="{ 'active': currentUserVote === 1 }" title="Gostei">
            <Icon name="lucide:thumbs-up" :size="16" />
            <span>{{ localLikesCount }}</span>
          </button>
          <button @click="handleVote(-1)" class="action-btn" :class="{ 'active': currentUserVote === -1 }" title="Não gostei">
            <Icon name="lucide:thumbs-down" :size="16" />
            <span>{{ localDislikesCount }}</span>
          </button>
          <button @click="emitReply" class="action-btn reply-btn-action" title="Responder">
            <Icon name="lucide:message-circle" :size="16" />
            <span>Responder</span>
          </button>
        </footer>
      </div>
    </div>

    <ConfirmDialog
      v-model:open="showDeleteConfirm"
      title="Excluir comentário"
      message="Excluir este comentário? Esta ação não pode ser desfeita."
      confirm-label="Excluir"
      busy-label="Excluindo..."
      :busy="isBusy"
      @confirm="executeDelete"
    />

    <ReportDialog
      v-if="comment.id"
      v-model:open="showReportDialog"
      target-type="comment"
      :target-id="comment.id"
      :is-moderated="!!comment.is_moderated || !!postIsModerated"
    />
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { CommentWithAuthor } from '~/types/app';
import { useToast } from 'vue-toastification';
import { formatTextToHtml, getEmbedVideoUrl, timeAgo } from '~/utils/formatters';

const props = defineProps<{
  comment: CommentWithAuthor;
  repliedToUsername?: string | null;
  isHighlighted?: boolean;
  postOwnerGroupId: string;
  postIsModerated?: boolean;
}>();

export type CommentUpdatedPayload = {
  id: string;
  text_content: string | null;
  image_path: string | null;
  video_url: string | null;
  is_edited: boolean;
  updated_at: string;
};

const emit = defineEmits<{
  (e: 'request-reply', payload: { commentId: string; username: string | null }): void;
  (e: 'scroll-to-comment', commentId: string): void;
  (e: 'vote-updated', payload: { commentId: string, likes: number, dislikes: number, userVote: number | null }): void;
  (e: 'deleted', commentId: string): void;
  (e: 'updated', payload: CommentUpdatedPayload): void;
}>();

const supabase = useSupabaseClient<Database>();
const authUserId = useAuthUserId();
const toast = useToast();

const defaultUserAvatar = '/images/default-avatar.png';

const currentUserVote = ref<number | null>(null);
const localLikesCount = ref(props.comment.likes_count || 0);
const localDislikesCount = ref(props.comment.dislikes_count || 0);
const localTextContent = ref(props.comment.text_content);
const localImagePath = ref(props.comment.image_path);
const localVideoUrl = ref(props.comment.video_url);
const localIsEdited = ref(!!props.comment.is_edited);

const isEditing = ref(false);
const editText = ref('');
const isBusy = ref(false);
const showDeleteConfirm = ref(false);
const showReportDialog = ref(false);

const {
  imageFile,
  imagePreviewUrl,
  videoUrlToSave,
  embedVideoUrl: editEmbedVideoUrl,
  isDraggingOver,
  fileInputRef,
  removeImage,
  removeVideo,
  resetMedia,
  initMedia,
  handlePaste,
  handleImageFileSelected,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  resolveImagePath,
  canSubmitWith,
} = useMediaAttachment(editText);

const canSaveEdit = computed(() => canSubmitWith());

const isAuthor = computed(() => {
  return !!authUserId.value && !!props.comment.author_id && authUserId.value === props.comment.author_id;
});

const canReport = computed(() => !isAuthor.value);

const showOptionsMenu = computed(() => isAuthor.value || canReport.value);

const authorAvatarUrl = computed(() => {
  return props.comment.author_avatar_path
    ? `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars/${props.comment.author_avatar_path}`
    : defaultUserAvatar;
});

const commentImageUrl = computed(() => {
  if (localImagePath.value) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/comment-media/${localImagePath.value}`;
  }
  return '';
});

const commentEmbedVideoUrl = computed(() => getEmbedVideoUrl(localVideoUrl.value));

async function fetchCurrentUserVoteForComment() {
  if (!authUserId.value || !props.comment.id) {
    currentUserVote.value = null;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('user_id', authUserId.value)
      .eq('target_id', props.comment.id)
      .eq('target_type', 'comment')
      .maybeSingle();

    if (error) throw error;
    currentUserVote.value = data ? data.vote_type : null;
  } catch (e: any) {
    console.error('Erro ao buscar voto do usuário no comentário:', e.message);
  }
}

watchEffect(() => {
  localLikesCount.value = props.comment.likes_count || 0;
  localDislikesCount.value = props.comment.dislikes_count || 0;
  localTextContent.value = props.comment.text_content;
  localImagePath.value = props.comment.image_path;
  localVideoUrl.value = props.comment.video_url;
  localIsEdited.value = !!props.comment.is_edited;
});

onMounted(() => {
  fetchCurrentUserVoteForComment();
});

watch(authUserId, () => {
  fetchCurrentUserVoteForComment();
});

async function handleVote(newVoteType: 1 | -1) {
  if (!authUserId.value || !props.comment.id) {
    return;
  }

  const oldVote = currentUserVote.value;
  let optimisticLikes = localLikesCount.value;
  let optimisticDislikes = localDislikesCount.value;

  if (oldVote === newVoteType) {
    currentUserVote.value = null;
    if (newVoteType === 1) optimisticLikes = Math.max(0, optimisticLikes - 1);
    else optimisticDislikes = Math.max(0, optimisticDislikes - 1);
  } else {
    if (oldVote === 1) optimisticLikes = Math.max(0, optimisticLikes - 1);
    else if (oldVote === -1) optimisticDislikes = Math.max(0, optimisticDislikes - 1);

    currentUserVote.value = newVoteType;
    if (newVoteType === 1) optimisticLikes++;
    else optimisticDislikes++;
  }
  localLikesCount.value = optimisticLikes;
  localDislikesCount.value = optimisticDislikes;

  try {
    if (oldVote === newVoteType) {
      await supabase.from('votes').delete().match({ user_id: authUserId.value, target_id: props.comment.id, target_type: 'comment' });
    } else if (oldVote !== null) {
      await supabase.from('votes').update({ vote_type: newVoteType }).match({ user_id: authUserId.value, target_id: props.comment.id, target_type: 'comment' });
    } else {
      await supabase.from('votes').insert({ user_id: authUserId.value, target_id: props.comment.id, target_type: 'comment', vote_type: newVoteType });
    }
    emit('vote-updated', { commentId: props.comment.id, likes: optimisticLikes, dislikes: optimisticDislikes, userVote: currentUserVote.value });
  } catch (e: any) {
    console.error('Erro ao votar no comentário:', e);
    toast.error(e.message || 'Falha ao registrar voto.');
    currentUserVote.value = oldVote;
    localLikesCount.value = props.comment.likes_count || 0;
    localDislikesCount.value = props.comment.dislikes_count || 0;
    fetchCurrentUserVoteForComment();
  }
}

function startEdit() {
  if (!isAuthor.value) return;
  editText.value = localTextContent.value || '';
  initMedia({
    imagePath: localImagePath.value,
    imagePublicUrl: localImagePath.value
      ? `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/comment-media/${localImagePath.value}`
      : null,
    videoUrl: localVideoUrl.value,
  });
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
  editText.value = '';
  resetMedia();
}

async function saveEdit() {
  if (!props.comment.id || !canSaveEdit.value) return;
  isBusy.value = true;
  try {
    let uploadedPath: string | null = null;
    if (imageFile.value && authUserId.value) {
      const file = imageFile.value;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${authUserId.value}_${Date.now()}.${fileExt}`;
      const filePath = `${props.comment.post_id}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comment-media')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = uploadData?.path ?? null;
    }

    const nextImagePath = resolveImagePath(uploadedPath);
    const nextVideoUrl = videoUrlToSave.value;

    const { data, error } = await supabase.rpc('edit_comment', {
      p_comment_id: props.comment.id,
      p_text_content: editText.value.trim(),
      p_image_path: nextImagePath,
      p_video_url: nextVideoUrl,
    });
    if (error) throw error;
    const updated = data as Database['public']['Tables']['comments']['Row'] | null;
    localTextContent.value = updated?.text_content ?? (editText.value.trim() || null);
    localImagePath.value = updated?.image_path ?? nextImagePath;
    localVideoUrl.value = updated?.video_url ?? nextVideoUrl;
    localIsEdited.value = true;
    isEditing.value = false;
    resetMedia();
    toast.success('Comentário atualizado.');
    emit('updated', {
      id: props.comment.id,
      text_content: localTextContent.value,
      image_path: localImagePath.value,
      video_url: localVideoUrl.value,
      is_edited: true,
      updated_at: updated?.updated_at || new Date().toISOString(),
    });
  } catch (e: any) {
    toast.error(e.message || 'Falha ao editar o comentário.');
  } finally {
    isBusy.value = false;
  }
}

function confirmDelete() {
  if (!props.comment.id || !isAuthor.value) return;
  showDeleteConfirm.value = true;
}

function openReportDialog() {
  if (!authUserId.value) {
    toast.info('Faça login para denunciar conteúdo.');
    navigateTo('/user/login');
    return;
  }
  if (isAuthor.value) return;
  showReportDialog.value = true;
}

async function executeDelete() {
  if (!props.comment.id || !isAuthor.value) return;
  isBusy.value = true;
  try {
    const { error } = await supabase.rpc('soft_delete_comment', { p_comment_id: props.comment.id });
    if (error) throw error;
    showDeleteConfirm.value = false;
    toast.success('Comentário excluído.');
    emit('deleted', props.comment.id);
  } catch (e: any) {
    toast.error(e.message || 'Falha ao excluir o comentário.');
  } finally {
    isBusy.value = false;
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
  display: flex;
  gap: 0.75rem;
  padding: 1rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.5s ease-out;
}
.comment-item:last-child { border-bottom: none; }
.comment-item.highlighted { background-color: color-mix(in srgb, var(--primary-color) 10%, transparent); }

.comment-main-content {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.author-avatar-small {
  width: 36px; height: 36px;
  border-radius: 50%; object-fit: cover; background-color: #eee;
  flex-shrink: 0;
}

.comment-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.comment-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.comment-author-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.comment-author-name { font-weight: 600; font-size: 0.9rem; }
.comment-timestamp { font-size: 0.75rem; color: #777; }

.reply-info { font-size: 0.8rem; color: #666; margin-bottom: 0.3rem; }
.reply-info a { color: var(--primary-color); cursor: pointer; text-decoration: none; }
.reply-info a:hover { color: var(--primary-color-hover); }

.comment-text {
  font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;
  margin-bottom: 0.75rem;
}
.comment-text :deep(a) { color: var(--primary-color); text-decoration: none; }
.comment-text :deep(a:hover) { color: var(--primary-color-hover); }

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}
.edit-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.65rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font: inherit;
  resize: vertical;
}
.edit-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}
.edit-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.edit-actions-right {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  align-items: center;
}
.edit-actions-right .button-secondary,
.edit-actions-right .button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  padding: 0 0.9em;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  box-sizing: border-box;
}
.add-image-btn {
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
.media-preview-container {
  border: 1px dashed var(--border-color);
  padding: 0.75rem;
  border-radius: 4px;
  position: relative;
}
.image-preview img {
  max-width: 100%;
  max-height: 220px;
  display: block;
  margin: 0 auto;
  border-radius: 4px;
}
.video-preview iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
}
.remove-media-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  padding: 0;
}
.edit-textarea.drag-over {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 30%, transparent);
}

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
.action-btn :deep(svg) {
  stroke: currentColor;
  fill: none;
}
.action-btn.active { color: var(--primary-color); font-weight: bold; }
.action-btn.active :deep(svg) {
  fill: var(--primary-color);
  stroke: var(--primary-color);
}
.action-btn span { font-size: 0.8rem; }
</style>
