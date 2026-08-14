<template>
  <div class="create-post-form card-style">
    <h3>Criar Nova Postagem</h3>
    <form @submit.prevent="submitPost">
      <div class="form-group">
        <textarea
          ref="textareaRef"
          v-model="textContent"
          placeholder="O que você tem em mente? Cole ou arraste uma imagem ou cole um link de vídeo do YouTube/Vimeo aqui."
          rows="4"
          @paste="handlePaste"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': isDraggingOver }"
        ></textarea>
      </div>

      <div v-if="imagePreviewUrl || embedVideoUrl" class="media-preview-container form-group">
        <div v-if="imagePreviewUrl" class="image-preview">
          <img :src="imagePreviewUrl" alt="Pré-visualização da imagem" />
          <button type="button" @click="removeImage" class="remove-media-btn">×</button>
        </div>
        <div v-if="embedVideoUrl" class="video-preview">
          <iframe
            :src="embedVideoUrl"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
          <button type="button" @click="removeVideo" class="remove-media-btn">×</button>
        </div>
      </div>

      <div class="form-actions-block">
        <div class="form-actions-toolbar">
          <div class="media-and-options">
            <label for="hidden-file-input" class="toolbar-action-btn button-secondary add-image-btn" title="Adicionar Imagem">
              <Icon name="lucide:image" :size="16" />
              <span class="btn-text">Imagem</span>
            </label>
            <input
              type="file" id="hidden-file-input" @change="handleImageFileSelected"
              accept="image/*" style="display: none" ref="fileInputRef"
            />

            <span class="toolbar-separator" aria-hidden="true" />

            <OptionToggle
              v-model="isAnonymous"
              label="Anônimo"
              icon="lucide:hat-glasses"
              title="Postar anonimamente"
            />
            <OptionToggle
              v-model="isModeratedContent"
              label="Moderado"
              icon="lucide:shield-check"
              title="Conteúdo requer moderação / Respostas moderadas"
            />

            <template v-if="ownerType === 'group' && availableIssues.length > 0">
              <span class="toolbar-separator" aria-hidden="true" />
              <IssueSelector
                v-model="selectedIssueIds"
                :issues="availableIssues"
              />
            </template>
          </div>

          <button type="submit" class="button-primary submit-post-btn" :disabled="isLoading || !canSubmit">
            <LoadingMessage v-if="isLoading" message="Postando..." :icon-size="16" />
            <template v-else>Postar</template>
          </button>
        </div>

        <div v-if="selectedIssueChips.length > 0" class="issue-chips">
          <button
            v-for="issue in selectedIssueChips"
            :key="issue.id"
            type="button"
            class="issue-chip"
            :title="`Remover ${issue.name}`"
            @click="removeSelectedIssue(issue.id)"
          >
            <span class="issue-chip-label">{{ issue.name }}</span>
            <Icon name="lucide:x" :size="12" class="issue-chip-x" />
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import { useToast } from 'vue-toastification';
import type { Issue, PostWithAuthor } from '~/types/app';

const MAX_POST_ISSUES = 5;

const props = defineProps<{
  ownerId: string;
  ownerType: 'group' | 'vs_group' | 'user_timeline';
}>();

const emit = defineEmits(['post-created']);

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const authUserId = useAuthUserId();
const userProfile = useProfile();
const toast = useToast();

const textContent = ref('');
const isAnonymous = ref(false);
const isModeratedContent = ref(!!userProfile.value?.default_moderated_posts);
const isLoading = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const availableIssues = ref<Issue[]>([]);
const selectedIssueIds = ref<string[]>([]);

const selectedIssueChips = computed(() => {
  const byId = new Map(availableIssues.value.map((issue) => [issue.id, issue]));
  return selectedIssueIds.value
    .map((id) => byId.get(id))
    .filter((issue): issue is Issue => !!issue);
});

function removeSelectedIssue(issueId: string) {
  selectedIssueIds.value = selectedIssueIds.value.filter((id) => id !== issueId);
}

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
} = useMediaAttachment(textContent);

const canSubmit = computed(() => canSubmitWith());

async function loadGroupIssues() {
  availableIssues.value = [];
  selectedIssueIds.value = [];

  if (props.ownerType !== 'group' || !props.ownerId) return;

  try {
    const { data, error } = await supabase.rpc('get_issues_for_group', {
      p_group_id: props.ownerId,
    });
    if (error) throw error;
    availableIssues.value = (data || []) as Issue[];
  } catch (e: any) {
    console.error('Erro ao carregar issues do grupo:', e);
    availableIssues.value = [];
  }
}

function resetForm() {
  textContent.value = '';
  resetMedia();
  isAnonymous.value = false;
  isModeratedContent.value = !!userProfile.value?.default_moderated_posts;
  selectedIssueIds.value = [];
}

watch(
  () => userProfile.value?.default_moderated_posts,
  (value) => {
    isModeratedContent.value = !!value;
  }
);

watch(
  () => [props.ownerType, props.ownerId] as const,
  () => {
    void loadGroupIssues();
  },
  { immediate: true },
);

async function submitPost() {
  if (!canSubmit.value) return;

  if (!authUserId.value) {
    toast.info('É necessário criar uma conta para publicar. Cadastre-se ou faça login.');
    await navigateTo('/user/register');
    return;
  }

  if (!textContent.value.trim() && !imageFile.value && !videoUrlToSave.value) return;

  isLoading.value = true;
  let imagePathToSave: string | null = null;

  try {
    if (imageFile.value) {
      const file = imageFile.value;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${authUserId.value}_${Date.now()}.${fileExt}`;
      const filePath = `${props.ownerType}/${props.ownerId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;
      if (uploadData) imagePathToSave = uploadData.path;
    }

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: authUserId.value,
        owner_id: props.ownerId,
        owner_type: props.ownerType,
        text_content: textContent.value.trim() || null,
        image_path: imagePathToSave,
        video_url: videoUrlToSave.value,
        is_anonymous: isAnonymous.value,
        is_moderated: isModeratedContent.value,
      })
      .select('*')
      .single();

    if (postError) throw postError;

    if (postData) {
      const issueIds = selectedIssueIds.value.slice(0, MAX_POST_ISSUES);
      if (issueIds.length > 0) {
        const { error: issuesError } = await supabase
          .from('post_issues')
          .insert(issueIds.map((issueId) => ({
            post_id: postData.id,
            issue_id: issueId,
          })));

        if (issuesError) {
          console.error('Erro ao vincular issues ao post:', issuesError);
          toast.error('Post criado, mas falhou ao salvar as issues: ' + issuesError.message);
        }
      }

      const emittedPost: PostWithAuthor = {
        ...postData,
        author_username: postData.is_anonymous ? null : (userProfile.value?.username || user.value?.email?.split('@')[0] || 'Usuário'),
        author_avatar_path: postData.is_anonymous ? null : (userProfile.value?.avatar_path || null),
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
        owner_id: props.ownerId,
        owner_type: props.ownerType,
        issue_ids: issueIds,
      };
      emit('post-created', emittedPost);
      resetForm();
    }
  } catch (e: any) {
    console.error('Erro ao criar post:', e);
    toast.error(e.message || 'Falha ao criar post.');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.create-post-component { margin-bottom: 1rem; }
.create-post-form h3 { margin-top: 0; margin-bottom: 0.85rem; border-bottom: 0; color: var(--primary-color); }
.form-group { margin-bottom: 0.65rem; }
textarea {
  width: 100%; min-height: 100px; padding: 0.75rem;
  border: 1px solid var(--border-color); border-radius: 4px;
  font-family: inherit; font-size: 1rem; line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
}
textarea:focus {
  outline: none; border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}
textarea.drag-over {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 30%, transparent),
              inset 0 0 10px color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.media-preview-container {
  border: 1px dashed var(--border-color);
  padding: 1rem;
  border-radius: 4px;
  position: relative;
  margin-bottom: 0.65rem;
}
.image-preview img { max-width: 100%; max-height: 300px; display: block; margin: 0 auto; border-radius: 4px; }
.video-preview iframe { width: 100%; aspect-ratio: 16 / 9; border-radius: 4px; }
.remove-media-btn {
  position: absolute; top: 5px; right: 5px;
  background-color: rgba(0,0,0,0.6); color: white;
  border: none; border-radius: 50%;
  width: 24px; height: 24px;
  font-size: 16px; line-height: 22px; text-align: center;
  cursor: pointer; padding: 0;
  transition: background-color 0.2s;
}
.remove-media-btn:hover { background-color: rgba(0,0,0,0.8); }
.form-actions-block {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.form-actions-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem 1rem;
  padding-top: 0.15rem;
}
.media-and-options {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.toolbar-separator {
  display: inline-block;
  width: 1px;
  height: 1.35rem;
  margin: 0 0.15rem;
  background: var(--border-color);
  flex-shrink: 0;
  align-self: center;
}
.issue-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.issue-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 1.6rem;
  padding: 0 0.55rem;
  border: 1px solid var(--primary-color-light);
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 8%, white);
  color: var(--primary-color-dark);
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.issue-chip-label {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
.issue-chip-x {
  display: block;
  flex-shrink: 0;
}
.issue-chip:hover {
  background: color-mix(in srgb, var(--primary-color) 16%, white);
  border-color: var(--primary-color);
}
.media-actions { margin-top: 0.5rem; }
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
.submit-post-btn {
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
.form-actions { display: flex; justify-content: flex-end; margin-top: 1rem; }

@media (max-width: 500px) {
  .form-actions-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .media-and-options {
    justify-content: flex-start;
    margin-bottom: 0.35rem;
  }
  .submit-post-btn {
    align-self: flex-end;
  }
}
</style>
