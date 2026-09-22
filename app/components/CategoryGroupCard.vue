<template>
  <div
    class="category-card"
    :class="{ clickable }"
    @click="emit('select')"
  >
    <div class="card-image-container">
      <img
        v-if="group.cover_image_path"
        :src="`${bucket}/covers/${group.cover_image_path}`"
        :alt="`Capa ${group.name}`"
        class="group-cover"
      >
      <div
        v-else
        class="group-cover-placeholder"
        :style="{ backgroundColor: flagFallbackColor }"
      />
      <div class="group-flag-container">
        <img
          v-if="flagUrl"
          :src="flagUrl"
          :alt="`Bandeira de ${group.name}`"
          class="group-flag"
          :class="{ logo: isLogoFlag }"
        >
        <div v-else class="group-flag-placeholder">
          <span>{{ group.name.substring(0, 1) }}</span>
        </div>
      </div>
    </div>
    <div class="card-content">
      <h2 class="category-name">{{ group.name }}</h2>
      <div class="status-row">
        <span class="group-status-badge" :class="group.is_open ? 'open' : 'closed'">
          <Icon
            :name="group.is_open ? 'lucide:unlock' : 'lucide:lock'"
            :size="14"
            class="group-status-icon"
          />
          Grupo {{ group.is_open ? 'Aberto' : 'Restrito' }}
        </span>
        <NuxtLink
          v-if="showMemberPreview"
          :to="detailsPath"
          class="member-preview"
          :aria-label="formatMemberCountLabel(memberCount ?? 0)"
          @click.stop
        >
          <div v-if="memberAvatars.length > 0" class="member-avatar-stack">
            <img
              v-for="(avatar, index) in memberAvatars"
              :key="`${avatar.url}-${index}`"
              :src="avatar.url"
              :alt="avatar.username || 'Membro'"
              class="member-avatar"
              :style="{ zIndex: memberAvatars.length - index }"
              loading="lazy"
            >
          </div>
          <span class="member-count">{{ formatMemberCountLabel(memberCount ?? 0) }}</span>
        </NuxtLink>
      </div>
      <p class="group-description line-clamp" :title="group.description || ''">{{ group.description }}</p>
      <div class="card-actions">
        <NuxtLink
          :to="`/${group.country_code}/${group.slug}`"
          class="button-secondary action-button"
          @click.stop
        >
          Acessar grupo
        </NuxtLink>

        <template v-if="!group.is_open">
          <button
            v-if="!biasDeclared"
            type="button"
            class="button-primary action-button"
            :disabled="declaring"
            @click.stop="emit('declare-bias')"
          >
            <LoadingMessage
              v-if="declaring"
              message="Declarando..."
              :icon-size="16"
            />
            <template v-else>Defender viés</template>
          </button>
          <span v-else class="bias-declared-badge">
            <Icon name="lucide:shield-check" :size="16" class="bias-declared-icon" />
            Viés Declarado
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Group } from '~/types/app';
import { isMetaGroup, resolveGroupFlagUrl } from '~/utils/groupFlags';
import {
  formatMemberCountLabel,
  type GroupMemberAvatarPreview,
} from '~/utils/groupMemberCounts';

const props = withDefaults(
  defineProps<{
    group: Group;
    clickable?: boolean;
    biasDeclared?: boolean;
    declaring?: boolean;
    memberCount?: number | null;
    memberAvatars?: GroupMemberAvatarPreview[];
  }>(),
  {
    memberCount: null,
    memberAvatars: () => [],
  },
);

const emit = defineEmits<{
  select: [];
  'declare-bias': [];
}>();

const bucket = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public';
const flagUrl = computed(() => resolveGroupFlagUrl(props.group));
const isLogoFlag = computed(() => isMetaGroup(props.group));
const { fallbackColor: flagFallbackColor } = useFlagTheme(() =>
  props.group.cover_image_path ? null : flagUrl.value
);

const detailsPath = computed(
  () => `/${props.group.country_code}/${props.group.slug}/details`,
);

const showMemberPreview = computed(
  () =>
    props.memberCount != null
    && (props.group.is_open === false || isMetaGroup(props.group)),
);
</script>

<style scoped>
.category-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.07);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  isolation: isolate;
}
.category-card.clickable { cursor: pointer; }
.category-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
}

.card-image-container {
  width: 100%;
  height: 200px;
  background-color: var(--primary-color-light);
  position: relative;
  z-index: 0;
}
.card-image-container::after {
  content: '';
  background-color: rgba(0, 0, 0, 0.3);
  height: 100%;
  position: relative;
  display: block;
  bottom: 320px;
}
.group-flag-container {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid var(--card-bg);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  background-color: var(--primary-color);
  position: relative;
  left: 15px;
  bottom: 110px;
  z-index: 1;
}
.group-flag-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem; font-weight: bold; color: var(--header-text);
}
.group-cover, .group-flag { width: 100%; height: 100%; object-fit: cover; }
.group-flag.logo {
  object-fit: contain;
  padding: 0.7rem;
  box-sizing: border-box;
  background-color: var(--primary-color);
}
.group-cover-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3.5rem; font-weight: bold;
}
.card-content {
  padding: 1.25rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.category-name {
  font-size: 1.4rem;
  color: var(--primary-color);
  margin-bottom: 0.3rem;
  font-weight: 600;
}
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
  min-width: 0;
}
.group-status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}
.group-status-icon {
  flex-shrink: 0;
}
.group-status-badge.open {
  color: var(--primary-color);
}
.group-status-badge.closed {
  color: #b81727;
}
.member-preview {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  margin: 0;
  min-width: 0;
  margin-left: auto;
  text-decoration: none;
  color: inherit;
  transition: color 0.15s ease;
}
.member-preview:hover {
  text-decoration: none;
  color: var(--primary-color);
}
.member-preview:hover .member-count {
  color: var(--primary-color);
}
.member-avatar-stack {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.member-avatar {
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--card-bg);
  background: #eee;
  box-sizing: border-box;
  margin-left: -0.45rem;
}
.member-avatar:first-child {
  margin-left: 0;
}
.member-count {
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.group-description {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 1rem;
  line-height: 1.6;
  flex-grow: 1;
}
.line-clamp {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: calc(0.9rem * 1.6 * 1);
  max-height: calc(0.9rem * 1.6 * 3);
}
.card-actions {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
}
.action-button {
  font-size: 0.8rem;
  padding: 0.6em 1em;
  text-align: center;
  white-space: nowrap;
}
.bias-declared-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--primary-color);
  white-space: nowrap;
}
.bias-declared-icon {
  flex-shrink: 0;
}
</style>
