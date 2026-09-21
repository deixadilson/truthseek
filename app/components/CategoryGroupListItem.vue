<template>
  <div class="list-node">
    <div class="list-line">
      <div v-if="depth > 0" class="tree-guides" aria-hidden="true">
        <template v-for="(continues, i) in trail" :key="`rail-${i}`">
          <span v-if="continues" class="tree-guide rail" />
        </template>
        <span
          class="tree-guide elbow"
          :class="isLast ? 'end' : 'mid'"
        />
      </div>

      <div
        class="list-row"
        :class="{ expandable: canExpand, expanded }"
        @click="onRowClick"
      >
        <span class="expand-slot" aria-hidden="true">
          <Icon
            v-if="canExpand"
            name="lucide:chevron-right"
            :size="22"
            class="expand-icon"
            :class="{ open: expanded }"
          />
        </span>

        <div class="flag-wrap">
          <img
            v-if="flagUrl"
            :src="flagUrl"
            :alt="`Bandeira de ${group.name}`"
            class="group-flag"
            :class="{ logo: isLogoFlag }"
          >
          <div v-else class="flag-placeholder">
            {{ group.name.substring(0, 1) }}
          </div>
        </div>

        <div class="row-main">
          <NuxtLink
            :to="`/${group.country_code}/${group.slug}`"
            class="group-title"
            @click.stop
          >
            {{ group.name }}
          </NuxtLink>
          <span class="status-badge" :class="group.is_open ? 'open' : 'closed'">
            <Icon
              :name="group.is_open ? 'lucide:unlock' : 'lucide:lock'"
              :size="13"
              class="status-icon"
            />
            {{ group.is_open ? 'Aberto' : 'Restrito' }}
          </span>
        </div>

        <div class="row-actions" @click.stop>
          <template v-if="!group.is_open">
            <button
              v-if="!biasDeclared"
              type="button"
              class="button-primary declare-btn"
              :disabled="declaring"
              @click="emit('declare-bias', group)"
            >
              <LoadingMessage
                v-if="declaring"
                message="Declarando..."
                :icon-size="14"
              />
              <template v-else>Defender viés</template>
            </button>
            <span v-else class="bias-declared">
              <Icon name="lucide:shield-check" :size="15" />
              Viés declarado
            </span>
          </template>
        </div>
      </div>
    </div>

    <Transition name="subtree">
      <div v-if="expanded" class="list-children">
        <div class="subtree-inner">
          <div v-if="loadingChildren" class="children-loading" :style="childrenIndentStyle">
            <LoadingMessage message="Carregando subgrupos..." :icon-size="14" />
          </div>
          <template v-else-if="children.length > 0">
            <CategoryGroupListItem
              v-for="(child, index) in children"
              :key="child.id"
              :group="child"
              :depth="depth + 1"
              :is-last="index === children.length - 1"
              :trail="childTrail"
              :bias-declared="isBiasDeclared(child.id)"
              :declaring="isDeclaring(child.id)"
              :load-children="loadChildren"
              :is-bias-declared="isBiasDeclared"
              :is-declaring="isDeclaring"
              @declare-bias="emit('declare-bias', $event)"
            />
          </template>
          <p v-else class="children-empty" :style="childrenIndentStyle">
            Nenhum subgrupo encontrado.
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Group } from '~/types/app';
import { isMetaGroup, resolveGroupFlagUrl } from '~/utils/groupFlags';

const props = withDefaults(defineProps<{
  group: Group;
  depth?: number;
  isLast?: boolean;
  /** Em cada ancestral: true = ainda há irmãos abaixo (desenha |). */
  trail?: boolean[];
  biasDeclared?: boolean;
  declaring?: boolean;
  loadChildren: (parentId: string) => Promise<Group[]>;
  isBiasDeclared: (groupId: string) => boolean;
  isDeclaring: (groupId: string) => boolean;
}>(), {
  depth: 0,
  isLast: true,
  trail: () => [],
  biasDeclared: false,
  declaring: false,
});

const emit = defineEmits<{
  'declare-bias': [group: Group];
}>();

const expanded = ref(false);
const loadingChildren = ref(false);
const children = ref<Group[]>([]);

const canExpand = computed(() => !!props.group.has_subgroups);
const flagUrl = computed(() => resolveGroupFlagUrl(props.group));
const isLogoFlag = computed(() => isMetaGroup(props.group));
const childTrail = computed(() => {
  // Raiz → 2º nível: só o cotovelo (├/└), sem coluna | extra.
  // A partir do 2º nível, propaga | quando o ancestral ainda tem irmãos.
  if (props.depth === 0) return [];
  return props.isLast ? [...props.trail] : [...props.trail, true];
});
const childrenIndentStyle = computed(() => ({
  paddingLeft: `calc(${(props.depth + 1) * 1.15 + 1.5}rem)`,
}));

async function onRowClick() {
  if (!canExpand.value) return;
  if (expanded.value) {
    expanded.value = false;
    return;
  }

  expanded.value = true;

  if (children.value.length > 0 || loadingChildren.value) return;

  loadingChildren.value = true;
  try {
    children.value = await props.loadChildren(props.group.id);
  } catch (e) {
    console.error('Erro ao carregar subgrupos:', e);
    expanded.value = false;
  } finally {
    loadingChildren.value = false;
  }
}
</script>

<style scoped>
.list-node {
  --row-gap: 0.4rem;
  --guide-size: 1.15rem;
  --guide-color: color-mix(in srgb, var(--primary-color) 42%, #9aa0a6);
  min-width: 0;
  margin-bottom: var(--row-gap);
}

.list-line {
  display: flex;
  align-items: stretch;
  gap: 0.3rem;
}

.tree-guides {
  display: flex;
  flex-shrink: 0;
  align-self: stretch;
}

.tree-guide {
  position: relative;
  width: var(--guide-size);
  flex: 0 0 var(--guide-size);
}

/* | — continuidade nos ancestrais */
.tree-guide.rail::before {
  content: '';
  position: absolute;
  left: 50%;
  top: calc(var(--row-gap) * -1);
  bottom: calc(var(--row-gap) * -1);
  border-left: 2px dashed var(--guide-color);
  transform: translateX(-50%);
}

/* ├ / └ */
.tree-guide.elbow::before {
  content: '';
  position: absolute;
  left: 50%;
  top: calc(var(--row-gap) * -1);
  border-left: 2px dashed var(--guide-color);
  transform: translateX(-50%);
}

.tree-guide.elbow.mid::before {
  bottom: calc(var(--row-gap) * -1);
}

.tree-guide.elbow.end::before {
  height: calc(50% + var(--row-gap));
}

.tree-guide.elbow::after {
  content: '';
  position: absolute;
  left: 50%;
  right: 0.1rem;
  top: 50%;
  border-top: 2px dashed var(--guide-color);
}

.list-row {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.65rem;
  padding: 0.55rem 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.list-row.expandable {
  cursor: pointer;
}

.list-row.expandable:hover {
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  background: color-mix(in srgb, var(--primary-color) 4%, var(--card-bg));
}

.expand-slot {
  width: 1.5rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.expand-icon {
  color: var(--primary-color);
  transition: transform 0.15s ease;
}

.expand-icon.open {
  transform: rotate(90deg);
}

.flag-wrap {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 5px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
  background: var(--primary-color-light, #e8eef5);
}

.group-flag {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.group-flag.logo {
  object-fit: contain;
  padding: 0.2rem;
  box-sizing: border-box;
  background: var(--primary-color);
}

.flag-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--primary-color);
}

.row-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.12rem;
}

.group-title {
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  font-weight: 600;
  color: var(--primary-color);
  text-decoration: none;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-title:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  width: fit-content;
  opacity: 0.55;
}

.status-badge.open {
  color: var(--primary-color);
}

.status-badge.closed {
  color: #b81727;
}

.status-icon {
  flex-shrink: 0;
}

.row-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.declare-btn {
  font-size: 0.78rem;
  padding: 0.45em 0.85em;
  white-space: nowrap;
}

.bias-declared {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--primary-color);
  white-space: nowrap;
}

.list-children {
  display: grid;
  grid-template-rows: 1fr;
}

.subtree-inner {
  min-height: 0;
  padding-top: 0.4rem;
  overflow: hidden;
}

.subtree-enter-active,
.subtree-leave-active {
  display: grid;
  transition:
    grid-template-rows 0.16s ease,
    opacity 0.14s ease;
  overflow: hidden;
}

.subtree-enter-active .subtree-inner,
.subtree-leave-active .subtree-inner {
  transition: transform 0.16s ease;
}

.subtree-enter-from,
.subtree-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.subtree-enter-from .subtree-inner,
.subtree-leave-to .subtree-inner {
  transform: translateY(-0.35rem);
}

.subtree-enter-to,
.subtree-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}

.subtree-enter-to .subtree-inner,
.subtree-leave-from .subtree-inner {
  transform: translateY(0);
}

.children-loading,
.children-empty {
  margin: 0 0 var(--row-gap);
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  color: #777;
}

@media (max-width: 480px) {
  .list-row {
    flex-wrap: wrap;
    row-gap: 0.4rem;
  }

  .row-actions {
    width: 100%;
    justify-content: flex-end;
    margin-left: 0;
  }
}
</style>
