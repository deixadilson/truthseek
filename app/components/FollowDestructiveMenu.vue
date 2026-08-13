<template>
  <Menu as="div" class="follow-destructive-menu" v-slot="{ open, close }">
    <MenuButton
      ref="buttonRef"
      class="follow-more-btn"
      title="Mais opções"
      :disabled="disabled"
      @click="updatePosition"
    >
      <Icon name="lucide:ellipsis-vertical" :size="size" />
    </MenuButton>

    <Teleport to="body">
      <transition
        enter-active-class="menu-enter-active"
        enter-from-class="menu-enter-from"
        enter-to-class="menu-enter-to"
        leave-active-class="menu-leave-active"
        leave-from-class="menu-leave-from"
        leave-to-class="menu-leave-to"
      >
        <MenuItems
          v-if="open"
          class="follow-more-panel"
          :style="panelStyle"
        >
          <MenuItem v-if="showUnfollow" v-slot="{ active }">
            <button
              type="button"
              class="menu-item danger"
              :class="{ active }"
              @click="emit('unfollow'); close()"
            >
              <Icon name="lucide:user-minus" :size="14" />
              Deixar de seguir
            </button>
          </MenuItem>
          <MenuItem v-if="showCancelRequest" v-slot="{ active }">
            <button
              type="button"
              class="menu-item danger"
              :class="{ active }"
              @click="emit('cancel-request'); close()"
            >
              <Icon name="lucide:user-x" :size="14" />
              Cancelar solicitação
            </button>
          </MenuItem>
          <MenuItem v-if="showBlock" v-slot="{ active }">
            <button
              type="button"
              class="menu-item danger"
              :class="{ active }"
              @click="emit('block'); close()"
            >
              <Icon name="lucide:ban" :size="14" />
              Bloquear Usuário
            </button>
          </MenuItem>
        </MenuItems>
      </transition>
    </Teleport>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';

withDefaults(defineProps<{
  showUnfollow?: boolean;
  showCancelRequest?: boolean;
  showBlock?: boolean;
  disabled?: boolean;
  size?: number;
}>(), {
  showUnfollow: false,
  showCancelRequest: false,
  showBlock: true,
  disabled: false,
  size: 16,
});

const emit = defineEmits<{
  unfollow: [];
  'cancel-request': [];
  block: [];
}>();

const buttonRef = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

function buttonEl(): HTMLElement | null {
  const refValue = buttonRef.value;
  if (!refValue) return null;
  if (refValue instanceof HTMLElement) return refValue;
  return refValue.$el ?? null;
}

function updatePosition() {
  nextTick(() => {
    const el = buttonEl();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedHeight = 120;
    const openUp = window.innerHeight - rect.bottom < estimatedHeight + 12;
    panelStyle.value = {
      position: 'fixed',
      zIndex: '3000',
      right: `${Math.max(8, window.innerWidth - rect.right)}px`,
      ...(openUp
        ? {
            bottom: `${Math.max(8, window.innerHeight - rect.top + 4)}px`,
            top: 'auto',
          }
        : {
            top: `${rect.bottom + 4}px`,
            bottom: 'auto',
          }),
    };
  });
}
</script>

<style scoped>
.follow-destructive-menu {
  position: relative;
  display: inline-flex;
}

.follow-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
}

.follow-more-btn:hover:not(:disabled),
.follow-more-btn:focus-visible {
  color: var(--primary-color);
  background: transparent;
  outline: none;
}

.follow-more-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.follow-more-panel {
  min-width: 200px;
  padding: 0.35rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  outline: none;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.65rem;
  border: none;
  border-radius: 4px;
  background: none;
  font-size: 0.88rem;
  color: var(--text-color);
  cursor: pointer;
  text-align: left;
}

.menu-item.danger {
  color: #b81727;
}

.menu-item.danger.active,
.menu-item.danger:hover {
  background: #fde8ec;
  color: #b81727;
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
