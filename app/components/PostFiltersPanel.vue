<template>
  <div class="post-filters card-style">
    <div class="filters-toolbar">
      <button
        type="button"
        class="filters-toggle"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <Icon name="lucide:sliders-horizontal" :size="16" />
        Filtros
        <Icon
          :name="isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          :size="16"
          class="chevron"
        />
      </button>

      <div class="search-field">
        <Icon name="lucide:search" :size="16" class="search-icon" />
        <input
          v-model="searchDraft"
          type="search"
          placeholder="Buscar postagens..."
          aria-label="Buscar postagens"
          @input="onSearchInput"
        />
        <button
          v-if="searchDraft"
          type="button"
          class="clear-search"
          title="Limpar busca"
          @click="clearSearch"
        >
          <Icon name="lucide:x" :size="14" />
        </button>
      </div>
    </div>

    <div v-show="isOpen" class="filters-panel">
      <div class="filter-group">
        <span class="filter-group-label">Tipo de conteúdo</span>
        <div class="filter-toggles">
          <OptionToggle v-model="showText" label="Texto" icon="lucide:type" title="Mostrar posts com texto" />
          <OptionToggle v-model="showImage" label="Imagem" icon="lucide:image" title="Mostrar posts com imagem" />
          <OptionToggle v-model="showVideo" label="Vídeo" icon="lucide:video" title="Mostrar posts com vídeo" />
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-group-label">Moderação</span>
        <div class="filter-toggles">
          <OptionToggle
            v-model="showModerated"
            label="Moderado"
            icon="lucide:shield-check"
            title="Mostrar posts moderados"
          />
          <OptionToggle
            v-model="showUnmoderated"
            label="Não moderado"
            icon="lucide:shield-off"
            title="Mostrar posts não moderados"
          />
        </div>
        <p v-if="preferModeratedOnly" class="filter-preference-hint">
          Preferência salva: exibindo apenas conteúdo moderado.
        </p>
      </div>

      <div v-if="availableIssues.length > 0" class="filter-group filter-group-issues">
        <span class="filter-group-label">Issue Tags</span>
        <div class="issue-filter-controls">
          <IssueSelector
            v-model="selectedIssueIds"
            :issues="availableIssues"
            :max-selected="10"
            label="Filtrar tags"
          />
          <div v-if="selectedIssueChips.length > 0" class="issue-filter-chips">
            <button
              v-for="issue in selectedIssueChips"
              :key="issue.id"
              type="button"
              class="issue-filter-chip"
              :title="`Remover filtro ${issue.name}`"
              @click="removeIssueFilter(issue.id)"
            >
              <span>{{ issue.name }}</span>
              <Icon name="lucide:x" :size="12" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="filter-group filter-group-reset">
        <span class="filter-group-label filter-group-label-spacer" aria-hidden="true">&nbsp;</span>
        <button
          type="button"
          class="button-tertiary reset-filters"
          @click="resetFilters"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Issue, PostWithAuthor } from '~/types/app';

const props = withDefaults(defineProps<{
  posts: PostWithAuthor[];
  availableIssues?: Issue[];
}>(), {
  availableIssues: () => [],
});

const emit = defineEmits<{
  (e: 'update:filtered', posts: PostWithAuthor[]): void;
}>();

const { preferModeratedOnly } = useModeratedContentPreference();

const isOpen = ref(false);
const showText = ref(true);
const showImage = ref(true);
const showVideo = ref(true);
const showModerated = ref(true);
const showUnmoderated = ref(true);
const selectedIssueIds = ref<string[]>([]);
const searchDraft = ref('');
const searchQuery = ref('');

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let syncingFromPreference = false;

const selectedIssueChips = computed(() => {
  const byId = new Map(props.availableIssues.map((issue) => [issue.id, issue]));
  return selectedIssueIds.value
    .map((id) => byId.get(id))
    .filter((issue): issue is Issue => !!issue);
});

function removeIssueFilter(issueId: string) {
  selectedIssueIds.value = selectedIssueIds.value.filter((id) => id !== issueId);
}

onMounted(() => {
  applyModeratedPreference(preferModeratedOnly.value);
});

watch(preferModeratedOnly, (value) => {
  applyModeratedPreference(value);
});

function applyModeratedPreference(value: boolean) {
  if (!value || syncingFromPreference) return;
  syncingFromPreference = true;
  showModerated.value = true;
  showUnmoderated.value = false;
  nextTick(() => {
    syncingFromPreference = false;
  });
}

watch([showModerated, showUnmoderated], ([moderated, unmoderated]) => {
  if (syncingFromPreference) return;
  preferModeratedOnly.value = moderated && !unmoderated;
});

const hasActiveFilters = computed(() => {
  const mediaRestricted = !showText.value || !showImage.value || !showVideo.value;
  const modRestricted = !showModerated.value || !showUnmoderated.value;
  const issueRestricted = selectedIssueIds.value.length > 0;
  return mediaRestricted || modRestricted || issueRestricted || !!searchQuery.value.trim();
});

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const issueFilters = selectedIssueIds.value;

  return props.posts.filter((post) => {
    const hasText = !!(post.text_content && post.text_content.trim());
    const hasImage = !!post.image_path;
    const hasVideo = !!post.video_url;

    const mediaFilterActive = !showText.value || !showImage.value || !showVideo.value;
    if (mediaFilterActive) {
      const anyMedia = showText.value || showImage.value || showVideo.value;
      if (!anyMedia) return false;
      const matchesMedia =
        (showText.value && hasText) ||
        (showImage.value && hasImage) ||
        (showVideo.value && hasVideo);
      if (!matchesMedia) return false;
    }

    const modFilterActive = !showModerated.value || !showUnmoderated.value;
    if (modFilterActive) {
      const anyMod = showModerated.value || showUnmoderated.value;
      if (!anyMod) return false;
      const isMod = !!post.is_moderated;
      if (isMod && !showModerated.value) return false;
      if (!isMod && !showUnmoderated.value) return false;
    }

    if (issueFilters.length > 0) {
      const postIssueIds = post.issue_ids || [];
      const matchesIssue = issueFilters.some((id) => postIssueIds.includes(id));
      if (!matchesIssue) return false;
    }

    if (q) {
      const hay = (post.text_content || '').toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
});

watch(
  filteredPosts,
  (value) => emit('update:filtered', value),
  { immediate: true }
);

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery.value = searchDraft.value;
  }, 250);
}

function clearSearch() {
  searchDraft.value = '';
  searchQuery.value = '';
}

function resetFilters() {
  showText.value = true;
  showImage.value = true;
  showVideo.value = true;
  showModerated.value = true;
  showUnmoderated.value = true;
  selectedIssueIds.value = [];
  preferModeratedOnly.value = false;
  clearSearch();
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});
</script>

<style scoped>
.post-filters {
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
}

.filters-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.filters-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 0.85em;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--primary-color);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
}

.filters-toggle:hover {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
}

.filters-toggle .chevron {
  opacity: 0.75;
}

.search-field {
  position: relative;
  flex: 1 1 12rem;
  min-width: 10rem;
}

.search-icon {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  pointer-events: none;
}

.search-field input {
  width: 100%;
  height: 2.25rem;
  padding: 0 2rem 0 2.1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font: inherit;
  font-size: 0.9rem;
  box-sizing: border-box;
  background: #fff;
}

.search-field input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.clear-search {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #777;
  cursor: pointer;
}

.clear-search:hover {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.filters-panel {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

@media (min-width: 768px) {
  .filters-panel {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 1.25rem 1.5rem;
  }

  .filter-group {
    flex: 0 1 auto;
  }
}

@media (min-width: 1024px) {
  .filters-panel {
    flex-wrap: nowrap;
  }

  .filter-group-reset {
    margin-left: auto;
  }
}

.filter-group-label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #777;
  line-height: 1.2;
  min-height: 1.2em;
}

.filter-group-label-spacer {
  visibility: hidden;
  user-select: none;
}

.filter-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.issue-filter-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.issue-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.issue-filter-chip {
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
}

.issue-filter-chip:hover {
  background: color-mix(in srgb, var(--primary-color) 16%, white);
  border-color: var(--primary-color);
}

.filter-preference-hint {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--primary-color);
}

.reset-filters {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  margin: 0;
  padding: 0 0.75em;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  box-sizing: border-box;
}

@media (max-width: 560px) {
  .filters-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-field {
    min-width: 0;
  }
}
</style>
