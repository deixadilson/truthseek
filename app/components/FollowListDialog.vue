<template>
  <Dialog :open="open" @close="handleClose" class="follow-list-dialog-root">
    <div class="follow-backdrop" aria-hidden="true" />

    <div class="follow-dialog-container">
      <DialogPanel class="follow-panel">
        <div class="follow-header">
          <DialogTitle class="follow-title">{{ title }}</DialogTitle>
          <button
            type="button"
            class="follow-close-icon"
            title="Fechar"
            @click="handleClose"
          >
            <Icon name="lucide:x" :size="18" />
          </button>
        </div>

        <div v-if="isLoading && items.length === 0" class="follow-status">
          <LoadingMessage message="Carregando..." />
        </div>
        <div v-else-if="items.length === 0" class="follow-status empty">
          {{ emptyMessage }}
        </div>
        <ul v-else class="follow-list">
          <li v-for="item in items" :key="item.id" class="follow-row">
            <NuxtLink
              :to="`/user/${item.username}`"
              class="follow-user"
              @click="handleClose"
            >
              <img
                :src="avatarUrl(item.avatar_path)"
                :alt="item.username"
                class="follow-avatar"
                @error="onAvatarError"
              />
              <span class="follow-username">{{ item.username }}</span>
            </NuxtLink>

            <div v-if="authUserId && item.id !== authUserId" class="follow-actions">
              <button
                type="button"
                class="follow-status-btn"
                :class="{
                  interactive: item.follow_status === 'none',
                  static: item.follow_status === 'following' || item.follow_status === 'requested',
                }"
                :disabled="item.follow_status !== 'none' || busyId === item.id"
                @click="handleRequestFollow(item)"
              >
                <LoadingMessage v-if="busyId === item.id" message="..." :icon-size="14" />
                <template v-else>
                  <Icon :name="statusIcon(item.follow_status)" :size="14" />
                  <span>{{ statusLabel(item.follow_status) }}</span>
                </template>
              </button>

              <FollowDestructiveMenu
                :show-unfollow="item.follow_status === 'following'"
                :show-cancel-request="item.follow_status === 'requested'"
                :disabled="busyId === item.id || isBlocking"
                @unfollow="handleUnfollow(item)"
                @cancel-request="handleCancelRequest(item)"
                @block="pendingBlock = item"
              />
            </div>
          </li>
        </ul>

        <div v-if="hasMore && items.length > 0" class="follow-load-more">
          <button
            type="button"
            class="button-secondary"
            :disabled="isLoadingMore"
            @click="loadMore"
          >
            <LoadingMessage v-if="isLoadingMore" message="Carregando..." :icon-size="14" />
            <template v-else>Carregar mais</template>
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>

  <ConfirmDialog
    :open="!!pendingBlock"
    title="Bloquear usuário?"
    :message="pendingBlock
      ? `Você não verá mais o conteúdo de @${pendingBlock.username} e as conexões entre vocês serão removidas.`
      : ''"
    confirm-label="Bloquear"
    busy-label="Bloqueando..."
    :busy="isBlocking"
    @confirm="confirmBlock"
    @cancel="pendingBlock = null"
  />
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import type { FollowListItem, FollowStatus } from '~/composables/useFollow';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  open: boolean;
  mode: 'followers' | 'following';
  userId: string;
  username?: string | null;
}>();

const emit = defineEmits<{
  close: [];
  changed: [];
}>();

const toast = useToast();
const authUserId = useAuthUserId();
const {
  listFollowers,
  listFollowing,
  requestFollow,
  unfollow,
  cancelFollowRequest,
  followToastMessage,
} = useFollow();
const { blockUser } = useBlock();

const PAGE_SIZE = 30;
const defaultAvatarUrl = '/images/default-avatar.png';
const avatarBucketPath = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

const items = ref<FollowListItem[]>([]);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const hasMore = ref(false);
const busyId = ref<string | null>(null);
const pendingBlock = ref<FollowListItem | null>(null);
const isBlocking = ref(false);

const title = computed(() =>
  props.mode === 'followers' ? 'Seguidores' : 'Seguindo'
);

const emptyMessage = computed(() =>
  props.mode === 'followers'
    ? 'Nenhum seguidor ainda.'
    : 'Não segue ninguém ainda.'
);

function avatarUrl(path: string | null) {
  return path ? `${avatarBucketPath}/${path}` : defaultAvatarUrl;
}

function onAvatarError(event: Event) {
  const img = event.target as HTMLImageElement;
  if (img.src !== defaultAvatarUrl) img.src = defaultAvatarUrl;
}

function statusLabel(status: FollowStatus) {
  if (status === 'following') return 'Seguindo';
  if (status === 'requested') return 'Solicitado';
  return 'Seguir';
}

function statusIcon(status: FollowStatus) {
  if (status === 'following') return 'lucide:user-check';
  if (status === 'requested') return 'lucide:clock';
  return 'lucide:user-plus';
}

function handleClose() {
  emit('close');
}

async function fetchPage(append = false) {
  if (!props.userId) return;
  if (append) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }
  try {
    const before = append
      ? items.value[items.value.length - 1]?.followed_at
      : null;
    const rows =
      props.mode === 'followers'
        ? await listFollowers(props.userId, PAGE_SIZE, before)
        : await listFollowing(props.userId, PAGE_SIZE, before);

    if (append) {
      const existing = new Set(items.value.map((i) => i.id));
      items.value = [...items.value, ...rows.filter((r) => !existing.has(r.id))];
    } else {
      items.value = rows;
    }
    hasMore.value = rows.length >= PAGE_SIZE;
  } catch (e: any) {
    console.error('Erro ao listar follows:', e);
    toast.error(e.message || 'Não foi possível carregar a lista.');
    if (!append) items.value = [];
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
}

async function loadMore() {
  if (isLoadingMore.value || !hasMore.value) return;
  await fetchPage(true);
}

async function handleRequestFollow(item: FollowListItem) {
  if (item.follow_status !== 'none') return;
  busyId.value = item.id;
  try {
    const next = await requestFollow(item.id);
    item.follow_status = next;
    toast.success(followToastMessage(next));
    emit('changed');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível enviar a solicitação.');
  } finally {
    busyId.value = null;
  }
}

async function handleUnfollow(item: FollowListItem) {
  if (item.follow_status !== 'following') return;
  busyId.value = item.id;
  try {
    await unfollow(item.id);
    item.follow_status = 'none';
    toast.success(followToastMessage('none'));
    emit('changed');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível deixar de seguir.');
  } finally {
    busyId.value = null;
  }
}

async function handleCancelRequest(item: FollowListItem) {
  if (item.follow_status !== 'requested') return;
  busyId.value = item.id;
  try {
    await cancelFollowRequest(item.id);
    item.follow_status = 'none';
    toast.success('Solicitação cancelada.');
    emit('changed');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível cancelar a solicitação.');
  } finally {
    busyId.value = null;
  }
}

async function confirmBlock() {
  if (!pendingBlock.value) return;
  isBlocking.value = true;
  try {
    await blockUser(pendingBlock.value.id);
    items.value = items.value.filter((i) => i.id !== pendingBlock.value?.id);
    toast.success('Usuário bloqueado.');
    pendingBlock.value = null;
    emit('changed');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível bloquear.');
  } finally {
    isBlocking.value = false;
  }
}

watch(
  () => [props.open, props.mode, props.userId] as const,
  ([open]) => {
    if (open && props.userId) {
      items.value = [];
      hasMore.value = false;
      void fetchPage(false);
    }
  }
);
</script>

<style scoped>
.follow-list-dialog-root {
  position: relative;
  z-index: 60;
}

.follow-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.follow-dialog-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.follow-panel {
  width: min(480px, 100%);
  max-height: min(70vh, 640px);
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.follow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.follow-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.follow-close-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #555;
  cursor: pointer;
  line-height: 1;
}

.follow-close-icon:hover {
  background: color-mix(in srgb, var(--primary-color-light) 50%, transparent);
  color: var(--primary-color);
}

.follow-status {
  padding: 2rem 1rem;
  text-align: center;
  color: #666;
}

.follow-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

.follow-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.follow-row:last-child {
  border-bottom: none;
}

.follow-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  font-weight: 600;
}

.follow-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #eee;
}

.follow-username {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follow-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.15rem;
}

.follow-status-btn {
  height: 2rem;
  min-width: 6.75rem;
  padding: 0 0.65em;
  font-size: 0.78rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border: 1px solid #c5c9ce;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
}

.follow-status-btn.static,
.follow-status-btn:disabled {
  opacity: 1;
  cursor: default;
  color: #6b7280;
  background: transparent;
  border-color: #c5c9ce;
}

.follow-status-btn.interactive:not(:disabled) {
  cursor: pointer;
  color: #6b7280;
  border-color: #c5c9ce;
}

.follow-status-btn.interactive:not(:disabled):hover {
  color: #4b5563;
  border-color: #9ca3af;
}

.follow-load-more {
  padding: 0.75rem 1rem 1rem;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 520px) {
  .follow-row {
    flex-direction: column;
    align-items: stretch;
  }

  .follow-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
