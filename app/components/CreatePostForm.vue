<template>
  <div class="create-post-form card-style">
    <h3>Criar Nova Postagem</h3>
    <form @submit.prevent="submitPost">
      <div class="form-group">
        <MarkdownEditor
          v-model="textContent"
          placeholder="O que você tem em mente? Cole uma imagem, um link de YouTube/Vimeo ou outro link HTTP(S) para prévia."
          :max-length="5000"
          :media-paste="handlePaste"
          :media-drop="handleDrop"
          :media-drag-over="handleDragOver"
          :media-drag-leave="handleDragLeave"
        />
      </div>

      <div v-if="imagePreviewUrl || embedVideoUrl || linkPreview || isLinkPreviewLoading" class="media-preview-container form-group">
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
        <div v-if="isLinkPreviewLoading" class="link-preview-loading">
          <LoadingMessage message="Buscando prévia do link..." :icon-size="16" />
        </div>
        <LinkPreviewCard
          v-else-if="linkPreview"
          :preview="linkPreview"
          removable
          @remove="removeLinkPreview"
        />
      </div>

      <div class="form-actions-block">
        <div
          ref="toolbarRef"
          class="form-actions-toolbar"
          :class="{
            'is-stacked': isToolbarStacked,
            'has-issues': hasIssueToolbar,
          }"
        >
          <div class="toolbar-primary-tools">
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
          </div>

          <template v-if="hasIssueToolbar">
            <span class="toolbar-separator toolbar-issues-separator" aria-hidden="true" />
            <IssueSelector
              v-model="selectedIssueIds"
              :issues="availableIssues"
              class="toolbar-issues"
            />
          </template>

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
  /** When set (e.g. VS parent), load issue tags from this group instead of ownerId. */
  issuesGroupId?: string | null;
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
  linkPreview,
  isLinkPreviewLoading,
  fileInputRef,
  removeImage,
  removeVideo,
  removeLinkPreview,
  resetMedia,
  handlePaste,
  handleImageFileSelected,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  canSubmitWith,
} = useMediaAttachment(textContent);

const canSubmit = computed(
  () => canSubmitWith() && textContent.value.length <= 5000 && !isLinkPreviewLoading.value
);

const toolbarRef = ref<HTMLElement | null>(null);
const isToolbarStacked = ref(false);
let toolbarObserver: ResizeObserver | null = null;

const hasIssueToolbar = computed(
  () => (props.ownerType === 'group' || props.ownerType === 'vs_group')
    && availableIssues.value.length > 0
);

function measureToolbarStack() {
  const toolbar = toolbarRef.value;
  if (!toolbar) return;

  const primary = toolbar.querySelector('.toolbar-primary-tools') as HTMLElement | null;
  const issues = toolbar.querySelector('.toolbar-issues') as HTMLElement | null;
  const issuesSep = toolbar.querySelector('.toolbar-issues-separator') as HTMLElement | null;
  const submit = toolbar.querySelector('.submit-post-btn') as HTMLElement | null;
  if (!primary || !submit) return;

  const gap = parseFloat(getComputedStyle(toolbar).columnGap || getComputedStyle(toolbar).gap || '0') || 0;

  // Force natural widths for one synchronous reflow so stacked flex/grid growth
  // does not inflate measured widths and lock the stacked state.
  toolbar.classList.add('is-measuring');
  const primaryWidth = primary.scrollWidth;
  const issuesWidth = issues ? issues.scrollWidth : 0;
  const issuesSepWidth = issuesSep ? issuesSep.offsetWidth : 0;
  const submitWidth = submit.offsetWidth;
  const available = toolbar.clientWidth;
  toolbar.classList.remove('is-measuring');

  const extras = issues
    ? gap + issuesSepWidth + gap + issuesWidth
    : 0;
  const needsStack = primaryWidth + extras + gap + submitWidth > available + 1;
  if (needsStack !== isToolbarStacked.value) {
    isToolbarStacked.value = needsStack;
  }
}

onMounted(() => {
  measureToolbarStack();
  if (typeof ResizeObserver === 'undefined' || !toolbarRef.value) return;
  toolbarObserver = new ResizeObserver(() => {
    measureToolbarStack();
  });
  toolbarObserver.observe(toolbarRef.value);
});

onBeforeUnmount(() => {
  toolbarObserver?.disconnect();
  toolbarObserver = null;
});

watch(
  () => [hasIssueToolbar.value, isLoading.value] as const,
  async () => {
    await nextTick();
    measureToolbarStack();
  }
);

async function loadGroupIssues() {
  availableIssues.value = [];
  selectedIssueIds.value = [];

  const sourceGroupId =
    props.issuesGroupId
    || (props.ownerType === 'group' ? props.ownerId : null);

  if (!sourceGroupId) return;

  try {
    const { data, error } = await supabase.rpc('get_issues_for_group', {
      p_group_id: sourceGroupId,
    });
    if (error) throw error;
    availableIssues.value = (data || []) as Issue[];
  } catch (e: any) {
    console.error('Erro ao carregar issues do grupo:', e);
    availableIssues.value = [];
  } finally {
    await nextTick();
    measureToolbarStack();
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
  () => [props.ownerType, props.ownerId, props.issuesGroupId] as const,
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

  if (!textContent.value.trim() && !imageFile.value && !videoUrlToSave.value && !linkPreview.value) return;

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
        image_path: linkPreview.value || videoUrlToSave.value ? null : imagePathToSave,
        video_url: linkPreview.value ? null : videoUrlToSave.value,
        link_preview: linkPreview.value,
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
.create-post-form {
  min-width: 0;
}
.create-post-form h3 { margin-top: 0; margin-bottom: 0.85rem; border-bottom: 0; color: var(--primary-color); }
.form-group { margin-bottom: 0.65rem; min-width: 0; }

.media-preview-container {
  border: 1px dashed var(--border-color);
  padding: 1rem;
  border-radius: 4px;
  position: relative;
  margin-bottom: 0.65rem;
}
.image-preview img { max-width: 100%; max-height: 300px; display: block; margin: 0 auto; border-radius: 4px; }
.video-preview {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}
.video-preview iframe {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
}
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
.link-preview-loading {
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}
.form-actions-block {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
}
.form-actions-toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.45rem;
  padding-top: 0.15rem;
  min-width: 0;
}
.toolbar-primary-tools {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.45rem;
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
.toolbar-issues {
  flex-shrink: 0;
  min-width: 0;
}

/* Stacked without issues: 3 tools full width, Postar below right */
.form-actions-toolbar.is-stacked:not(.has-issues) {
  flex-wrap: wrap;
}
.form-actions-toolbar.is-stacked:not(.has-issues) .toolbar-primary-tools {
  flex: 1 1 100%;
  width: 100%;
}
.form-actions-toolbar.is-stacked:not(.has-issues) .toolbar-primary-tools > :not(.toolbar-separator) {
  flex: 1 1 0;
  min-width: 0;
}
.form-actions-toolbar.is-stacked:not(.has-issues) .toolbar-separator {
  display: none;
}
.form-actions-toolbar.is-stacked:not(.has-issues) .toolbar-action-btn.add-image-btn,
.form-actions-toolbar.is-stacked:not(.has-issues) :deep(.option-toggle) {
  width: 100%;
}
.form-actions-toolbar.is-stacked:not(.has-issues) .submit-post-btn {
  margin-left: auto;
}

/* Stacked with issues: 3 tools on row 1; Issues left + Postar right on row 2 */
.form-actions-toolbar.is-stacked.has-issues {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "primary primary"
    "issues postar";
  align-items: center;
  column-gap: 0.45rem;
  row-gap: 0.45rem;
}
.form-actions-toolbar.is-stacked.has-issues .toolbar-primary-tools {
  grid-area: primary;
  width: 100%;
}
.form-actions-toolbar.is-stacked.has-issues .toolbar-primary-tools > :not(.toolbar-separator) {
  flex: 1 1 0;
  min-width: 0;
}
.form-actions-toolbar.is-stacked.has-issues .toolbar-separator {
  display: none;
}
.form-actions-toolbar.is-stacked.has-issues .toolbar-action-btn.add-image-btn,
.form-actions-toolbar.is-stacked.has-issues .toolbar-primary-tools :deep(.option-toggle) {
  width: 100%;
}
.form-actions-toolbar.is-stacked.has-issues .toolbar-issues {
  grid-area: issues;
  justify-self: start;
}
.form-actions-toolbar.is-stacked.has-issues .submit-post-btn {
  grid-area: postar;
  margin-left: 0;
  justify-self: end;
}

/* Natural widths while measuring fit (avoids stacked layout locking). */
.form-actions-toolbar.is-measuring {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  grid-template-columns: none !important;
  grid-template-areas: none !important;
}
.form-actions-toolbar.is-measuring .toolbar-primary-tools {
  flex: 0 0 auto !important;
  width: auto !important;
}
.form-actions-toolbar.is-measuring .toolbar-primary-tools > :not(.toolbar-separator) {
  flex: 0 0 auto !important;
  min-width: auto !important;
}
.form-actions-toolbar.is-measuring .toolbar-separator {
  display: inline-block !important;
}
.form-actions-toolbar.is-measuring .toolbar-action-btn.add-image-btn,
.form-actions-toolbar.is-measuring :deep(.option-toggle),
.form-actions-toolbar.is-measuring :deep(.issue-selector),
.form-actions-toolbar.is-measuring :deep(.issue-selector .option-toggle) {
  width: auto !important;
}
.form-actions-toolbar.is-measuring .toolbar-issues {
  justify-self: auto !important;
}
.form-actions-toolbar.is-measuring .submit-post-btn {
  margin-left: auto !important;
  justify-self: auto !important;
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
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  box-sizing: border-box;
  flex-shrink: 0;
}
.form-actions { display: flex; justify-content: flex-end; margin-top: 1rem; }
</style>
