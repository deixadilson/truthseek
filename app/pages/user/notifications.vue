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
        <div class="notification-row">
          <button type="button" class="notification-main" @click="openItem(item)">
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

          <div
            v-if="item.type === 'follow_request' && item.actor_id"
            class="follow-request-actions"
          >
            <button
              type="button"
              class="button-primary request-btn"
              :disabled="busyRequestId === item.id"
              @click.stop="onAcceptRequest(item)"
            >
              <LoadingMessage
                v-if="busyRequestId === item.id && busyAction === 'accept'"
                message="..."
                :icon-size="14"
              />
              <template v-else>Aceitar</template>
            </button>
            <button
              type="button"
              class="button-secondary request-btn"
              :disabled="busyRequestId === item.id"
              @click.stop="onRejectRequest(item)"
            >
              <LoadingMessage
                v-if="busyRequestId === item.id && busyAction === 'reject'"
                message="..."
                :icon-size="14"
              />
              <template v-else>Recusar</template>
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="hasMore && notifications.length > 0" class="load-more-wrap">
      <button
        type="button"
        class="button-secondary"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        <LoadingMessage v-if="isLoadingMore" message="Carregando..." :icon-size="16" />
        <template v-else>Carregar mais</template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications';
import { timeAgo } from '~/utils/formatters';
import { useToast } from 'vue-toastification';

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
  removeNotification,
  fetchNotifications,
  markAllRead,
  markOneRead,
} = useNotifications();
const { acceptFollowRequest, rejectFollowRequest } = useFollow();
const toast = useToast();

const PAGE_SIZE = 30;
const isBusy = ref(false);
const isLoadingMore = ref(false);
const hasMore = ref(false);
const busyRequestId = ref<string | null>(null);
const busyAction = ref<'accept' | 'reject' | null>(null);
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

async function onAcceptRequest(item: AppNotification) {
  if (!item.actor_id) return;
  busyRequestId.value = item.id;
  busyAction.value = 'accept';
  try {
    await acceptFollowRequest(item.actor_id);
    removeNotification(item.id);
    toast.success('Solicitação aceita.');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível aceitar a solicitação.');
  } finally {
    busyRequestId.value = null;
    busyAction.value = null;
  }
}

async function onRejectRequest(item: AppNotification) {
  if (!item.actor_id) return;
  busyRequestId.value = item.id;
  busyAction.value = 'reject';
  try {
    await rejectFollowRequest(item.actor_id);
    removeNotification(item.id);
    toast.success('Solicitação recusada.');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível recusar a solicitação.');
  } finally {
    busyRequestId.value = null;
    busyAction.value = null;
  }
}

async function loadInitial() {
  hasMore.value = !!(await fetchNotifications(PAGE_SIZE));
}

async function loadMore() {
  if (isLoadingMore.value || !hasMore.value || notifications.value.length === 0) return;
  const last = notifications.value[notifications.value.length - 1];
  if (!last?.created_at) return;
  isLoadingMore.value = true;
  try {
    hasMore.value = !!(await fetchNotifications(PAGE_SIZE, last.created_at, true));
  } finally {
    isLoadingMore.value = false;
  }
}

onMounted(() => {
  loadInitial();
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
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.notifications-list li:last-child .notification-row {
  border-bottom: none;
}

.notifications-list li.unread .notification-row {
  background: color-mix(in srgb, var(--primary-color-light) 40%, transparent);
}

.notification-main {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.notification-main:hover .text {
  color: var(--primary-color);
}

.follow-request-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: calc(40px + 0.75rem);
}

.request-btn {
  height: 2rem;
  padding: 0 0.9em;
  font-size: 0.85rem;
  min-width: 5.5rem;
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

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1.25rem;
}

.load-more-wrap .button-secondary {
  min-width: 10rem;
}
</style>
