<template>
  <div v-if="issues.length > 0" class="issue-selector">
    <button
      ref="triggerRef"
      type="button"
      class="option-toggle"
      :class="{ open: isOpen }"
      title="Selecionar issue tags"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click="toggleOpen"
    >
      <Icon name="lucide:tags" :size="16" class="option-toggle-icon" />
      <span class="option-toggle-label">{{ label }}</span>
      <Icon
        :name="isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'"
        :size="16"
        class="option-toggle-icon"
      />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelRef"
        class="issue-panel"
        :style="panelStyle"
        role="dialog"
        aria-label="Selecionar issue tags"
      >
        <div class="issue-filter">
          <Icon name="lucide:search" :size="16" class="filter-icon" />
          <input
            ref="filterInputRef"
            v-model="filterText"
            type="search"
            placeholder="Filtrar issues..."
            aria-label="Filtrar issues"
          >
          <button
            v-if="filterText"
            type="button"
            class="clear-filter"
            title="Limpar filtro"
            @click="filterText = ''"
          >
            <Icon name="lucide:x" :size="14" />
          </button>
        </div>

        <ul v-if="visibleRoots.length > 0" class="issue-tree" role="list">
          <li v-for="root in visibleRoots" :key="root.id" class="issue-tree-node">
            <label class="issue-row">
              <input
                type="checkbox"
                :checked="isSelected(root.id)"
                :disabled="!isSelected(root.id) && atLimit"
                @change="toggleIssue(root.id)"
              >
              <span class="issue-name">{{ root.name }}</span>
            </label>

            <ul
              v-if="visibleChildren(root).length > 0"
              class="issue-tree children"
              role="list"
            >
              <li
                v-for="child in visibleChildren(root)"
                :key="child.id"
                class="issue-tree-node"
              >
                <label class="issue-row child">
                  <input
                    type="checkbox"
                    :checked="isSelected(child.id)"
                    :disabled="!isSelected(child.id) && atLimit"
                    @change="toggleIssue(child.id)"
                  >
                  <span class="issue-name">{{ child.name }}</span>
                </label>
              </li>
            </ul>
          </li>
        </ul>
        <p v-else class="issue-empty">Nenhuma issue encontrada.</p>

        <p v-if="atLimit" class="issue-limit-hint">
          Limite de {{ maxSelected }} issues por post.
        </p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Issue } from '~/types/app';

const props = withDefaults(defineProps<{
  issues: Issue[];
  modelValue: string[];
  maxSelected?: number;
  label?: string;
}>(), {
  maxSelected: 5,
  label: 'Issue Tags',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const filterText = ref('');
const isOpen = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const filterInputRef = ref<HTMLInputElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

const roots = computed(() =>
  props.issues
    .filter((issue) => !issue.parent_issue_id)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'pt-BR')),
);

const childrenByParent = computed(() => {
  const map = new Map<string, Issue[]>();
  for (const issue of props.issues) {
    if (!issue.parent_issue_id) continue;
    const list = map.get(issue.parent_issue_id) || [];
    list.push(issue);
    map.set(issue.parent_issue_id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'pt-BR'));
  }
  return map;
});

const normalizedFilter = computed(() => filterText.value.trim().toLowerCase());

function matchesFilter(issue: Issue): boolean {
  const q = normalizedFilter.value;
  if (!q) return true;
  return issue.name.toLowerCase().includes(q);
}

const visibleRoots = computed(() => {
  if (!normalizedFilter.value) return roots.value;

  return roots.value.filter((root) => {
    if (matchesFilter(root)) return true;
    const children = childrenByParent.value.get(root.id) || [];
    return children.some((child) => matchesFilter(child));
  });
});

function visibleChildren(root: Issue): Issue[] {
  const children = childrenByParent.value.get(root.id) || [];
  if (!normalizedFilter.value) return children;
  if (matchesFilter(root)) return children;
  return children.filter((child) => matchesFilter(child));
}

const atLimit = computed(() => props.modelValue.length >= props.maxSelected);

function isSelected(id: string): boolean {
  return props.modelValue.includes(id);
}

function toggleIssue(id: string) {
  if (isSelected(id)) {
    emit(
      'update:modelValue',
      props.modelValue.filter((selectedId) => selectedId !== id),
    );
    return;
  }

  if (atLimit.value) return;
  emit('update:modelValue', [...props.modelValue, id]);
}

function updatePanelPosition() {
  const trigger = triggerRef.value;
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  const panelWidth = Math.min(26 * 16, window.innerWidth - 16);
  let left = rect.left;

  if (left + panelWidth > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - panelWidth - 8);
  }

  panelStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 6)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(panelWidth)}px`,
  };
}

function openPanel() {
  isOpen.value = true;
  nextTick(() => {
    updatePanelPosition();
    filterInputRef.value?.focus();
  });
}

function closePanel() {
  isOpen.value = false;
  filterText.value = '';
}

function toggleOpen() {
  if (isOpen.value) closePanel();
  else openPanel();
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!isOpen.value) return;
  const target = event.target as Node | null;
  if (!target) return;
  if (triggerRef.value?.contains(target)) return;
  if (panelRef.value?.contains(target)) return;
  closePanel();
}

function onWindowChange() {
  if (!isOpen.value) return;
  updatePanelPosition();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  window.addEventListener('resize', onWindowChange);
  window.addEventListener('scroll', onWindowChange, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  window.removeEventListener('resize', onWindowChange);
  window.removeEventListener('scroll', onWindowChange, true);
});
</script>

<style scoped>
.issue-selector {
  display: inline-flex;
  align-items: center;
}

.option-toggle {
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
  white-space: nowrap;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--card-bg, #fff);
  color: #666;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
}

.option-toggle:hover,
.option-toggle.open {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.option-toggle-icon {
  flex-shrink: 0;
  display: block;
}

.option-toggle-label {
  line-height: 1;
}

.issue-panel {
  z-index: 1200;
  max-height: 20rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg, #fff);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
}

.issue-filter {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.filter-icon {
  position: absolute;
  left: 1.05rem;
  color: #888;
  pointer-events: none;
}

.issue-filter input {
  width: 100%;
  height: 2.1rem;
  padding: 0 2rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font: inherit;
  font-size: 0.9rem;
}

.issue-filter input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 18%, transparent);
}

.clear-filter {
  position: absolute;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #777;
  cursor: pointer;
}

.clear-filter:hover {
  background: #f1f5f9;
  color: #333;
}

.issue-tree {
  list-style: none;
  margin: 0;
  padding: 0.4rem 0.35rem;
  overflow-y: auto;
  max-height: 14rem;
}

.issue-tree.children {
  padding: 0 0 0.15rem 1.35rem;
  max-height: none;
  overflow: visible;
}

.issue-tree-node {
  margin: 0;
}

.issue-row {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.4rem 0.55rem;
  border-radius: 6px;
  cursor: pointer;
}

.issue-row:hover {
  background: color-mix(in srgb, var(--primary-color) 6%, white);
}

.issue-row.child {
  padding-left: 0.45rem;
}

.issue-row input {
  margin-top: 0.15rem;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.issue-row input:disabled {
  cursor: not-allowed;
}

.issue-name {
  font-size: 0.9rem;
  line-height: 1.35;
  color: var(--text-color, #333);
}

.issue-empty,
.issue-limit-hint {
  margin: 0;
  padding: 0.65rem 0.85rem 0.85rem;
  font-size: 0.82rem;
  color: #64748b;
}

.issue-limit-hint {
  border-top: 1px solid var(--border-color);
  padding-top: 0.55rem;
}
</style>
