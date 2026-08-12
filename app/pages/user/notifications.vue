<template>
  <div class="notifications-page container">
    <header class="page-header">
      <h1>Notificações</h1>
      <button
        v-if="unreadCount > 0"
        type="button"
        class="button-secondary mark-all"
        :disabled="isBusy"
        @click="onMarkAll"
      >
        Marcar todas como lidas
      </button>
    </header>

    <div v-if="isLoading && !hasLoaded" class="status-block">
      <LoadingMessage message="Carregando notificações..." />
    </div>
    <div v-else-if="notifications.length === 0" class="status-block empty">
      Você ainda não tem notificações.
    </div>
    <ul v-else class="notifications-list card-style">
      <li
        v-for="item in notifications"
        :key="item.id"
        :class="{ unread: !item.read_at }"
      >
        <button type="button" class="notification-row" @click="openItem(item)">
          <img
            :src="actorAvatar(item)"
            alt=""
            class="avatar"
            @error="onAvatarError"
          />
          <div class="body">
            <p class="text">{{ notificationMessage(item) }}</p>
            <span class="time">{{ timeAgo(item.created_at) }}</span>
          </div>
          <span v-if="!item.read_at" class="unread-dot" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications';
import { timeAgo } from '~/utils/formatters';

definePageMeta({
  middleware: 'auth',
});

const {
  notifications,
  unreadCount,
  isLoading,
  hasLoaded,
  notificationMessage,
  notificationLink,
  fetchNotifications,
  markAllRead,
  markOneRead,
} = useNotifications();

const isBusy = ref(false);
const defaultUserAvatar = '/images/default-avatar.png';
const avatarBucket = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

useHead({ title: 'Notificações - TruthSeek Network' });

function actorAvatar(item: AppNotification) {
  if (item.actor_avatar_path) return `${avatarBucket}/${item.actor_avatar_path}`;
  return defaultUserAvatar;
}

function onAvatarError(event: Event) {
  const img = event.target as HTMLImageElement;
  if (img.src !== defaultUserAvatar) img.src = defaultUserAvatar;
}

async function onMarkAll() {
  isBusy.value = true;
  try {
    await markAllRead();
  } finally {
    isBusy.value = false;
  }
}

async function openItem(item: AppNotification) {
  await markOneRead(item.id);
  const link = notificationLink(item);
  if (link) await navigateTo(link);
}

onMounted(() => {
  fetchNotifications(50);
});
</script>

<style scoped>
.notifications-page {
  max-width: 720px;
  padding: 1.5rem 1rem 3rem;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--primary-color);
}

.mark-all {
  height: 2.25rem;
  padding: 0 0.9em;
  font-size: 0.85rem;
}

.status-block {
  padding: 2rem 1rem;
  text-align: center;
  color: #666;
}

.status-block.empty {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.notifications-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.notification-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: none;
  border-bottom: 1px solid var(--border-color);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.notifications-list li:last-child .notification-row {
  border-bottom: none;
}

.notifications-list li.unread .notification-row {
  background: color-mix(in srgb, var(--primary-color-light) 40%, transparent);
}

.notification-row:hover {
  background: var(--primary-color-light);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.body {
  flex: 1;
  min-width: 0;
}

.text {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  line-height: 1.4;
}

.time {
  font-size: 0.8rem;
  color: #888;
}

.unread-dot {
  width: 8px;
  height: 8px;
  margin-top: 0.45rem;
  border-radius: 50%;
  background: var(--primary-color);
  flex-shrink: 0;
}
</style>
