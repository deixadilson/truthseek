<template>
  <div class="notification-bell" ref="rootRef">
    <button
      type="button"
      class="bell-btn"
      title="Notificações"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggleOpen"
    >
      <Icon name="lucide:bell" :size="18" />
      <span v-if="unreadCount > 0" class="bell-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div v-if="isOpen" class="bell-dropdown">
      <div class="bell-header">
        <strong>Notificações</strong>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="mark-all-btn"
          @click="markAllRead"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div v-if="isLoading && !hasLoaded" class="bell-status">
        <LoadingMessage message="Carregando..." :icon-size="14" />
      </div>
      <div v-else-if="notifications.length === 0" class="bell-status">
        Nenhuma notificação ainda.
      </div>
      <ul v-else class="bell-list">
        <li
          v-for="item in notifications.slice(0, 8)"
          :key="item.id"
          :class="{ unread: !item.read_at }"
        >
          <button type="button" class="bell-item" @click="openNotification(item)">
            <img
              :src="actorAvatar(item)"
              alt=""
              class="bell-avatar"
              @error="onAvatarError"
            />
            <span class="bell-body">
              <span class="bell-text">{{ notificationMessage(item) }}</span>
              <span class="bell-time">{{ timeAgo(item.created_at) }}</span>
            </span>
          </button>
        </li>
      </ul>

      <NuxtLink to="/user/notifications" class="bell-footer" @click="isOpen = false">
        Ver todas
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications';
import { timeAgo } from '~/utils/formatters';

const {
  notifications,
  unreadCount,
  isLoading,
  hasLoaded,
  notificationMessage,
  notificationLink,
  fetchNotifications,
  refreshUnreadCount,
  markAllRead,
  markOneRead,
  startRealtime,
  stopRealtime,
} = useNotifications();

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const defaultUserAvatar = '/images/default-avatar.png';
const avatarBucket = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';
const authUserId = useAuthUserId();

function actorAvatar(item: AppNotification) {
  if (item.actor_avatar_path) return `${avatarBucket}/${item.actor_avatar_path}`;
  return defaultUserAvatar;
}

function onAvatarError(event: Event) {
  const img = event.target as HTMLImageElement;
  if (img.src !== defaultUserAvatar) img.src = defaultUserAvatar;
}

async function toggleOpen() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    await fetchNotifications(20);
  }
}

async function openNotification(item: AppNotification) {
  await markOneRead(item.id);
  isOpen.value = false;
  const link = notificationLink(item);
  if (link) await navigateTo(link);
}

function onDocumentClick(event: MouseEvent) {
  if (!isOpen.value || !rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshUnreadCount();
  }
}

onMounted(() => {
  refreshUnreadCount();
  startRealtime();
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('visibilitychange', onVisibilityChange);
});

watch(authUserId, (id) => {
  if (id) {
    refreshUnreadCount();
    startRealtime();
  } else {
    stopRealtime();
  }
});

onBeforeUnmount(() => {
  stopRealtime();
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--header-text);
  cursor: pointer;
}

.bell-btn:hover {
  color: var(--primary-color-light);
  background: color-mix(in srgb, var(--header-text) 12%, transparent);
}

.bell-badge {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 1.05rem;
  height: 1.05rem;
  padding: 0 0.28rem;
  border-radius: 999px;
  background: #e11d48;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.05rem;
  text-align: center;
}

.bell-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: 1200;
  width: min(22rem, calc(100vw - 1.5rem));
  background: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.bell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.92rem;
}

.mark-all-btn {
  border: none;
  background: none;
  padding: 0;
  font-size: 0.75rem;
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: underline;
}

.bell-status {
  padding: 1.25rem 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: #777;
}

.bell-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 22rem;
  overflow-y: auto;
}

.bell-item {
  width: 100%;
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.7rem 0.9rem;
  border: none;
  border-bottom: 1px solid var(--border-color);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.bell-list li.unread .bell-item {
  background: color-mix(in srgb, var(--primary-color-light) 45%, transparent);
}

.bell-item:hover {
  background: var(--primary-color-light);
}

.bell-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.bell-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.bell-text {
  font-size: 0.86rem;
  line-height: 1.35;
}

.bell-time {
  font-size: 0.75rem;
  color: #888;
}

.bell-footer {
  display: block;
  padding: 0.7rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary-color);
  text-decoration: none;
  border-top: 1px solid var(--border-color);
}

.bell-footer:hover {
  background: var(--primary-color-light);
}
</style>
