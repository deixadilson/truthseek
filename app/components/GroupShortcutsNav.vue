<template>
  <nav
    v-if="authUserId"
    class="group-shortcuts-nav"
    :class="`variant-${variant}`"
    aria-label="Atalhos de grupos"
  >
    <section class="shortcuts-section" :class="{ 'card-style': variant === 'sidebar' }">
      <component :is="variant === 'sidebar' ? 'h4' : 'h3'" class="shortcuts-heading">
        Meus vieses
      </component>
      <p v-if="!isLoading && biases.length === 0" class="shortcuts-empty">
        Nenhum viés declarado ainda.
      </p>
      <ul v-else class="shortcuts-list">
        <li v-for="item in biases" :key="item.key">
          <NuxtLink
            :to="item.to"
            class="shortcuts-link"
            :class="{
              active: isActive(item.to),
              'has-meta': showMemberMeta(item),
            }"
            @click="onNavigate"
          >
            <span
              v-if="showMemberMeta(item) && flagUrl(item.flagPath)"
              class="shortcuts-media"
            >
              <img
                :src="flagUrl(item.flagPath)!"
                alt=""
                class="shortcuts-flag"
                loading="lazy"
              />
            </span>
            <template v-else-if="!showMemberMeta(item)">
              <img
                v-if="flagUrl(item.flagPath)"
                :src="flagUrl(item.flagPath)!"
                alt=""
                class="shortcuts-flag"
                loading="lazy"
              />
            </template>
            <span v-if="showMemberMeta(item)" class="shortcuts-meta">
              <span class="shortcuts-name">{{ item.name }}</span>
              <span class="shortcuts-members">
                {{ formatMemberCountLabel(item.memberCount ?? 0) }}
              </span>
            </span>
            <span v-else class="shortcuts-name">{{ item.name }}</span>
          </NuxtLink>
        </li>
      </ul>
      <p v-if="showBiasesLimitHint" class="shortcuts-limit-hint">
        Mostrando os {{ SIDEBAR_BIASES_LIMIT }} com mais influência
      </p>
    </section>

    <section class="shortcuts-section" :class="{ 'card-style': variant === 'sidebar' }">
      <component :is="variant === 'sidebar' ? 'h4' : 'h3'" class="shortcuts-heading">
        Favoritos
      </component>
      <p v-if="!isLoading && favorites.length === 0" class="shortcuts-empty">
        Nenhum favorito ainda.
      </p>
      <ul v-else class="shortcuts-list">
        <li v-for="item in favorites" :key="item.key">
          <NuxtLink
            :to="item.to"
            class="shortcuts-link"
            :class="{
              active: isActive(item.to),
              'has-meta': showMemberMeta(item),
            }"
            @click="onNavigate"
          >
            <span
              v-if="showMemberMeta(item) && flagUrl(item.flagPath)"
              class="shortcuts-media"
            >
              <img
                :src="flagUrl(item.flagPath)!"
                alt=""
                class="shortcuts-flag"
                loading="lazy"
              />
            </span>
            <template v-else-if="!showMemberMeta(item)">
              <img
                v-if="flagUrl(item.flagPath)"
                :src="flagUrl(item.flagPath)!"
                alt=""
                class="shortcuts-flag"
                loading="lazy"
              />
              <Icon
                v-else-if="item.targetType === 'vs_group'"
                name="lucide:swords"
                :size="14"
                class="shortcuts-icon"
              />
            </template>
            <span v-if="showMemberMeta(item)" class="shortcuts-meta">
              <span class="shortcuts-name">{{ item.name }}</span>
              <span class="shortcuts-members">
                {{ formatMemberCountLabel(item.memberCount ?? 0) }}
              </span>
            </span>
            <span v-else class="shortcuts-name">{{ item.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </nav>
</template>

<script setup lang="ts">
import {
  SIDEBAR_BIASES_LIMIT,
  type GroupShortcutItem,
} from '~/composables/useGroupShortcuts'
import { formatMemberCountLabel } from '~/utils/groupMemberCounts'

withDefaults(
  defineProps<{
    variant?: 'sidebar' | 'mobile'
  }>(),
  { variant: 'sidebar' },
)

const emit = defineEmits<{ (e: 'navigate'): void }>()

const route = useRoute()
const authUserId = useAuthUserId()
const { biases, biasesTotal, favorites, isLoading, ensureLoaded } = useGroupShortcuts()

const showBiasesLimitHint = computed(
  () => !isLoading.value && biasesTotal.value > SIDEBAR_BIASES_LIMIT,
)

const FLAG_BASE =
  'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags'

function flagUrl(path: string | null | undefined) {
  if (!path) return null
  return `${FLAG_BASE}/${path}`
}

function showMemberMeta(item: GroupShortcutItem) {
  return item.targetType === 'group' && item.isOpen === false
}

function isActive(to: string) {
  const path = route.path.replace(/\/$/, '') || '/'
  const target = to.replace(/\/$/, '') || '/'
  return path === target || path.startsWith(`${target}/`)
}

function onNavigate() {
  emit('navigate')
}

watch(
  authUserId,
  (id) => {
    if (id) void ensureLoaded()
  },
  { immediate: true },
)
</script>

<style scoped>
.group-shortcuts-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.shortcuts-section {
  min-width: 0;
}

.shortcuts-heading {
  margin: 0 0 0.45rem;
}

.variant-sidebar {
  gap: 1.5rem;
}

.variant-sidebar .shortcuts-section.card-style {
  margin-bottom: 0;
  padding: 1rem 1.1rem;
}

.variant-sidebar .shortcuts-heading {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  text-transform: none;
  letter-spacing: normal;
}

.variant-sidebar .shortcuts-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.variant-sidebar .shortcuts-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.5rem 0;
  border-radius: 0;
  text-decoration: none;
  color: var(--link-color);
  font-size: 0.9rem;
  line-height: 1.25;
  border-bottom: 1px dotted var(--border-color);
  transition: color 0.15s ease;
}

.variant-sidebar .shortcuts-link.has-meta {
  --media-size: 40px;
  gap: 0.55rem;
  padding: 0.45rem 0;
}

.variant-sidebar .shortcuts-link:hover,
.variant-sidebar .shortcuts-link.active {
  background: transparent;
  color: var(--primary-color-dark);
  text-decoration: none;
}

.variant-sidebar .shortcuts-link:hover .shortcuts-name,
.variant-sidebar .shortcuts-link.active .shortcuts-name {
  color: var(--primary-color);
}

.variant-sidebar .shortcuts-list li:last-child .shortcuts-link {
  border-bottom: none;
}

.variant-sidebar .shortcuts-link.active {
  font-weight: 600;
}

.shortcuts-empty {
  margin: 0;
  font-size: 0.85rem;
  color: #777;
  font-style: italic;
  line-height: 1.35;
}

.shortcuts-limit-hint {
  margin: 0.55rem 0 0;
  font-size: 0.75rem;
  color: #888;
  line-height: 1.3;
}

.shortcuts-media {
  flex-shrink: 0;
  width: var(--media-size, 40px);
  height: var(--media-size, 40px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcuts-media .shortcuts-flag {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
  box-sizing: border-box;
  border-radius: 3px;
}

.shortcuts-flag {
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
}

.shortcuts-icon {
  flex-shrink: 0;
  color: var(--primary-color);
}

.shortcuts-meta {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0;
  height: var(--media-size, 40px);
  min-width: 0;
  flex: 1;
}

.shortcuts-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  line-height: 1.15;
}

.shortcuts-members {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.15;
  color: #777;
  white-space: nowrap;
}

.variant-sidebar .shortcuts-link:hover .shortcuts-members,
.variant-sidebar .shortcuts-link.active .shortcuts-members {
  color: #666;
}

.variant-mobile {
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  border: none;
}

.variant-mobile .shortcuts-section {
  padding: 0.15rem 0 0.35rem;
  border-bottom: 1px solid color-mix(in srgb, var(--header-text) 15%, transparent);
}

.variant-mobile .shortcuts-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.variant-mobile .shortcuts-heading {
  margin: 0 0 0.2rem;
  padding: 0.55rem 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--header-text) 65%, transparent);
  border-bottom: none;
}

.variant-mobile .shortcuts-empty {
  color: color-mix(in srgb, var(--header-text) 60%, transparent);
  font-style: normal;
  padding: 0.25rem 0 0.45rem;
}

.variant-mobile .shortcuts-limit-hint {
  color: color-mix(in srgb, var(--header-text) 55%, transparent);
  padding: 0.35rem 0 0.15rem;
}

.variant-mobile .shortcuts-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.variant-mobile .shortcuts-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--header-text);
  padding: 0.55rem 0;
  border-radius: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--header-text) 10%, transparent);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.15s ease;
}

.variant-mobile .shortcuts-link.has-meta {
  --media-size: 40px;
  gap: 0.55rem;
}

.variant-mobile .shortcuts-list li:last-child .shortcuts-link {
  border-bottom: none;
}

.variant-mobile .shortcuts-link:hover,
.variant-mobile .shortcuts-link.active {
  background: transparent;
  color: var(--primary-color-light);
  text-decoration: none;
}

.variant-mobile .shortcuts-link:hover .shortcuts-name,
.variant-mobile .shortcuts-link.active .shortcuts-name {
  color: var(--primary-color-light);
}

.variant-mobile .shortcuts-icon {
  color: var(--header-text);
}

.variant-mobile .shortcuts-members {
  color: color-mix(in srgb, var(--header-text) 55%, transparent);
  font-weight: 400;
}

.variant-mobile .shortcuts-link:hover .shortcuts-members,
.variant-mobile .shortcuts-link.active .shortcuts-members {
  color: color-mix(in srgb, var(--header-text) 70%, transparent);
}
</style>
