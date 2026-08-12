<template>
  <article class="post-item card-style">
    <header class="post-header">
      <AuthorPopover
        :author-id="post.author_id"
        :context-group-id="post.owner_id"
        :hide-trigger-arrow="true"
        v-if="post.author_id && post.owner_id && !post.is_anonymous"
      >
        <div class="author-info">
          <img :src="authorAvatarUrl" alt="Avatar do autor" class="author-avatar"/>
          <div>
            <span class="author-name">{{ post.author_username || (post.is_anonymous ? 'Anônimo' : 'Usuário Desconhecido') }}</span>
            <span v-if="post.created_at" class="post-timestamp">
              {{ timeAgo(post.created_at) }}
              <template v-if="localIsEdited">
                ·
                <EditedHistoryLink
                  v-if="post.id"
                  target-type="post"
                  :target-id="post.id"
                  media-bucket="post-media"
                />
              </template>
            </span>
            <span v-else class="post-timestamp">Data indisponível</span>
          </div>
        </div>
      </AuthorPopover>
      <div v-else class="author-info">
         <img :src="authorAvatarUrl" alt="Avatar" class="author-avatar"/>
          <div>
            <span class="author-name">{{ post.is_anonymous ? 'Anônimo' : (post.author_username || 'Usuário Desconhecido') }}</span>
            <span v-if="post.created_at" class="post-timestamp">
              {{ timeAgo(post.created_at) }}
              <template v-if="localIsEdited">
                ·
                <EditedHistoryLink
                  v-if="post.id"
                  target-type="post"
                  :target-id="post.id"
                  media-bucket="post-media"
                />
              </template>
            </span>
          </div>
      </div>
      <ContentOptionsMenu
        v-if="post.id && showOptionsMenu"
        :can-edit="isAuthor"
        :can-delete="isAuthor"
        :can-report="canReport"
        :share-url="shareUrl"
        :disabled="isBusy"
        @edit="startEdit"
        @delete="confirmDelete"
        @share="sharePost"
        @report="openReportDialog"
      />
    </header>

    <div class="post-content">
      <form v-if="isEditing" class="edit-form" @submit.prevent="saveEdit">
        <textarea
          v-model="editText"
          rows="4"
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
            <iframe
              :src="editEmbedVideoUrl"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
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
        <p v-if="localTextContent" class="text-content" v-html="formattedTextContent"></p>
        <div v-if="localImagePath" class="image-content">
          <img :src="postImageUrl" :alt="`Imagem do post de ${post.author_username || 'usuário'}`" />
        </div>
        <div v-if="localVideoUrl" class="video-content">
          <iframe
            :src="embedVideoUrl || undefined"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </template>
    </div>

    <footer class="post-footer">
      <div class="actions">
        <button class="action-btn like-btn" @click="handleVote(1)" :class="{ 'active': currentUserVote === 1 }">
          <Icon name="lucide:thumbs-up" :size="18" />
          <span>{{ localLikesCount }}</span>
        </button>
        <button class="action-btn dislike-btn" @click="handleVote(-1)" :class="{ 'active': currentUserVote === -1 }">
          <Icon name="lucide:thumbs-down" :size="18" />
          <span>{{ localDislikesCount }}</span>
        </button>
        <NuxtLink :to="`/post/${post.id}`" class="action-btn comment-btn">
          <Icon name="lucide:message-square" :size="18" />
          <span>{{ post.comments_count || 0 }}</span>
        </NuxtLink>
      </div>
      <div class="share-action">
        <button class="action-btn share-btn" title="Compartilhar" @click="sharePost">
          <Icon name="lucide:share-2" :size="18" />
        </button>
      </div>
    </footer>

    <ConfirmDialog
      v-model:open="showDeleteConfirm"
      title="Excluir post"
      message="Excluir este post? Esta ação não pode ser desfeita."
      confirm-label="Excluir"
      busy-label="Excluindo..."
      :busy="isBusy"
      @confirm="executeDelete"
    />

    <ReportDialog
      v-if="post.id"
      v-model:open="showReportDialog"
      target-type="post"
      :target-id="post.id"
      :is-moderated="!!post.is_moderated"
    />
  </article>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { PostWithAuthor } from '~/types/app';
import { useToast } from 'vue-toastification';
import { formatTextToHtml, getEmbedVideoUrl, timeAgo } from '~/utils/formatters';

const props = defineProps<{
  post: PostWithAuthor;
}>();

export type PostUpdatedPayload = {
  id: string;
  text_content: string | null;
  image_path: string | null;
  video_url: string | null;
  is_edited: boolean;
  updated_at: string;
};

const emit = defineEmits<{
  (e: 'deleted', postId: string): void;
  (e: 'updated', payload: PostUpdatedPayload): void;
}>();

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const authUserId = useAuthUserId();
const toast = useToast();

const currentUserVote = ref<number | null>(null);
const localLikesCount = ref(props.post.likes_count || 0);
const localDislikesCount = ref(props.post.dislikes_count || 0);
const localTextContent = ref(props.post.text_content);
const localImagePath = ref(props.post.image_path);
const localVideoUrl = ref(props.post.video_url);
const localIsEdited = ref(!!props.post.is_edited);

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

const defaultUserAvatar = '/images/default-avatar.png';

const isAuthor = computed(() => {
  return !!authUserId.value && !!props.post.author_id && authUserId.value === props.post.author_id;
});

const canReport = computed(() => {
  return !isAuthor.value;
});

const shareUrl = computed(() => {
  if (!props.post.id || !import.meta.client) return `/post/${props.post.id}`;
  return `${window.location.origin}/post/${props.post.id}`;
});

const showOptionsMenu = computed(() => {
  return isAuthor.value || canReport.value || !!shareUrl.value;
});

const authorAvatarUrl = computed(() => {
  const path = props.post.author_avatar_path;
  if (path) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars/${path}`;
  }
  return defaultUserAvatar;
});

const postImageUrl = computed(() => {
  if (localImagePath.value) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/post-media/${localImagePath.value}`;
  }
  return '';
});

const embedVideoUrl = computed(() => getEmbedVideoUrl(localVideoUrl.value));
const formattedTextContent = computed(() => formatTextToHtml(localTextContent.value));

async function fetchCurrentUserVote() {
  if (!authUserId.value || !props.post.id) {
    currentUserVote.value = null;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('user_id', authUserId.value)
      .eq('target_id', props.post.id)
      .eq('target_type', 'post')
      .maybeSingle();

    if (error) throw error;
    currentUserVote.value = data ? data.vote_type : null;
  } catch (e: any) {
    console.error('Erro ao buscar voto do usuário:', e.message);
  }
}

async function handleVote(newVoteType: 1 | -1) {
  if (!authUserId.value || !props.post.id) return;

  const oldVote = currentUserVote.value;

  if (oldVote === newVoteType) {
    currentUserVote.value = null;
    if (newVoteType === 1) localLikesCount.value = Math.max(0, localLikesCount.value - 1);
    else localDislikesCount.value = Math.max(0, localDislikesCount.value - 1);
  } else {
    currentUserVote.value = newVoteType;
    if (oldVote === 1) localLikesCount.value = Math.max(0, localLikesCount.value - 1);
    else if (oldVote === -1) localDislikesCount.value = Math.max(0, localDislikesCount.value - 1);

    if (newVoteType === 1) localLikesCount.value++;
    else localDislikesCount.value++;
  }

  try {
    if (oldVote === newVoteType) {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', authUserId.value)
        .eq('target_id', props.post.id)
        .eq('target_type', 'post');
      if (error) throw error;
    } else if (oldVote !== null && oldVote !== newVoteType) {
      const { error } = await supabase
        .from('votes')
        .update({ vote_type: newVoteType })
        .eq('user_id', authUserId.value)
        .eq('target_id', props.post.id)
        .eq('target_type', 'post');
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('votes')
        .insert({
          user_id: authUserId.value,
          target_id: props.post.id,
          target_type: 'post',
          vote_type: newVoteType,
        });
      if (error) throw error;
    }
  } catch (e: any) {
    console.error('Erro ao registrar like:', e);
    toast.error(e.message || 'Falha ao registrar like.');
    currentUserVote.value = oldVote;
  }
}

function startEdit() {
  if (!isAuthor.value) return;
  editText.value = localTextContent.value || '';
  initMedia({
    imagePath: localImagePath.value,
    imagePublicUrl: localImagePath.value
      ? `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/post-media/${localImagePath.value}`
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
  if (!props.post.id || !canSaveEdit.value) return;
  isBusy.value = true;
  try {
    let uploadedPath: string | null = null;
    if (imageFile.value && authUserId.value) {
      const file = imageFile.value;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${authUserId.value}_${Date.now()}.${fileExt}`;
      const filePath = `${props.post.owner_type}/${props.post.owner_id}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = uploadData?.path ?? null;
    }

    const nextImagePath = resolveImagePath(uploadedPath);
    const nextVideoUrl = videoUrlToSave.value;

    const { data, error } = await supabase.rpc('edit_post', {
      p_post_id: props.post.id,
      p_text_content: editText.value.trim(),
      p_image_path: nextImagePath,
      p_video_url: nextVideoUrl,
    });
    if (error) throw error;
    const updated = data as Database['public']['Tables']['posts']['Row'] | null;
    localTextContent.value = updated?.text_content ?? (editText.value.trim() || null);
    localImagePath.value = updated?.image_path ?? nextImagePath;
    localVideoUrl.value = updated?.video_url ?? nextVideoUrl;
    localIsEdited.value = true;
    isEditing.value = false;
    resetMedia();
    toast.success('Post atualizado.');
    emit('updated', {
      id: props.post.id,
      text_content: localTextContent.value,
      image_path: localImagePath.value,
      video_url: localVideoUrl.value,
      is_edited: true,
      updated_at: updated?.updated_at || new Date().toISOString(),
    });
  } catch (e: any) {
    toast.error(e.message || 'Falha ao editar o post.');
  } finally {
    isBusy.value = false;
  }
}

function confirmDelete() {
  if (!props.post.id || !isAuthor.value) return;
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
  if (!props.post.id || !isAuthor.value) return;
  isBusy.value = true;
  try {
    const { error } = await supabase.rpc('soft_delete_post', { p_post_id: props.post.id });
    if (error) throw error;
    showDeleteConfirm.value = false;
    toast.success('Post excluído.');
    emit('deleted', props.post.id);
  } catch (e: any) {
    toast.error(e.message || 'Falha ao excluir o post.');
  } finally {
    isBusy.value = false;
  }
}

async function sharePost() {
  const url = shareUrl.value;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'TruthSeek Network', url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado.');
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado.');
    } catch {
      toast.error('Não foi possível compartilhar o link.');
    }
  }
}

watchEffect(() => {
  localLikesCount.value = props.post.likes_count || 0;
  localDislikesCount.value = props.post.dislikes_count || 0;
  localTextContent.value = props.post.text_content;
  localImagePath.value = props.post.image_path;
  localVideoUrl.value = props.post.video_url;
  localIsEdited.value = !!props.post.is_edited;
});

onMounted(() => {
  fetchCurrentUserVote();
});

watch(user, () => {
  fetchCurrentUserVote();
});
</script>

<style scoped>
.post-item {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
}
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.75rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #eee;
}
.author-name {
  font-weight: 600;
  color: var(--text-color);
  display: block;
}
.post-timestamp {
  font-size: 0.8rem;
  color: #777;
}

.post-content {
  margin-bottom: 1rem;
}
.text-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 0.75rem;
}
.text-content :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.edit-textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
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
  padding: 1rem;
  border-radius: 4px;
  position: relative;
}
.image-preview img {
  max-width: 100%;
  max-height: 300px;
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
.remove-media-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
}
.edit-textarea.drag-over {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 30%, transparent);
}

.image-content img {
  max-width: 100%;
  border-radius: 6px;
  margin-top: 0.5rem;
  display: block;
}
.video-content iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.9rem;
}
.actions {
  display: flex;
  gap: 1rem;
}
.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #555;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}
.action-btn:hover {
  background-color: var(--primary-color-light);
  color: var(--primary-color-dark);
  text-decoration: none;
}
.action-btn :deep(svg) {
  stroke: currentColor;
  fill: none;
}
.action-btn.active {
  color: var(--primary-color);
}
.action-btn.active :deep(svg) {
  fill: var(--primary-color);
  stroke: var(--primary-color);
}
.action-btn span {
  font-size: 0.85rem;
}
.share-action .action-btn:hover {
  background-color: transparent;
  color: var(--primary-color);
}
</style>
