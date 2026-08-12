<template>
  <Menu as="div" class="content-options" v-slot="{ close }">
    <MenuButton class="options-btn" title="Opções" :disabled="disabled">
      <Icon name="lucide:ellipsis-vertical" :size="18" />
    </MenuButton>

    <transition
      enter-active-class="menu-enter-active"
      enter-from-class="menu-enter-from"
      enter-to-class="menu-enter-to"
      leave-active-class="menu-leave-active"
      leave-from-class="menu-leave-from"
      leave-to-class="menu-leave-to"
    >
      <MenuItems class="options-menu">
        <MenuItem v-if="canEdit" v-slot="{ active }">
          <button
            type="button"
            class="menu-item"
            :class="{ active }"
            @click="emit('edit'); close()"
          >
            <Icon name="lucide:pencil" :size="14" />
            Editar
          </button>
        </MenuItem>
        <MenuItem v-if="shareUrl" v-slot="{ active }">
          <button
            type="button"
            class="menu-item"
            :class="{ active }"
            @click="emit('share'); close()"
          >
            <Icon name="lucide:share-2" :size="14" />
            Compartilhar
          </button>
        </MenuItem>
        <MenuItem v-if="canDelete" v-slot="{ active }">
          <button
            type="button"
            class="menu-item danger"
            :class="{ active }"
            @click="emit('delete'); close()"
          >
            <Icon name="lucide:trash-2" :size="14" />
            Excluir
          </button>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';

defineProps<{
  canEdit?: boolean;
  canDelete?: boolean;
  shareUrl?: string | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'share'): void;
}>();
</script>

<style scoped>
.content-options {
  position: relative;
}

.options-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem;
  color: #777;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.options-btn:hover:not(:disabled) {
  color: var(--primary-color);
  background-color: var(--primary-color-light);
}

.options-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.options-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 30;
  min-width: 150px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  padding: 0.35rem;
  outline: none;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.65rem;
  border: none;
  background: none;
  border-radius: 4px;
  font-size: 0.88rem;
  color: var(--text-color);
  cursor: pointer;
  text-align: left;
}

.menu-item.active,
.menu-item:hover {
  background: var(--primary-color-light);
  color: var(--primary-color);
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
