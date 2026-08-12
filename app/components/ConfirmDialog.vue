<template>
  <Dialog :open="open" @close="handleDismiss" class="confirm-dialog-root">
    <div class="confirm-backdrop" aria-hidden="true" />

    <div class="confirm-dialog-container">
      <DialogPanel class="confirm-panel">
        <div class="confirm-header">
          <DialogTitle class="confirm-title">{{ title }}</DialogTitle>
          <button
            type="button"
            class="confirm-close-icon"
            title="Fechar"
            :disabled="busy"
            @click="handleDismiss"
          >
            <Icon name="lucide:x" :size="18" />
          </button>
        </div>

        <p v-if="message" class="confirm-message">{{ message }}</p>

        <div class="confirm-actions">
          <button
            type="button"
            class="button-secondary confirm-btn"
            :disabled="busy"
            @click="handleDismiss"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="confirm-btn confirm-danger"
            :disabled="busy"
            @click="emit('confirm')"
          >
            <LoadingMessage v-if="busy" :message="busyLabel" :icon-size="14" />
            <template v-else>{{ confirmLabel }}</template>
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';

const props = withDefaults(defineProps<{
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  busy?: boolean;
}>(), {
  title: 'Confirmar',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  busyLabel: 'Aguarde...',
  busy: false,
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'update:open', value: boolean): void;
}>();

function handleDismiss() {
  if (props.busy) return;
  emit('cancel');
  emit('update:open', false);
}
</script>

<style scoped>
.confirm-dialog-root {
  position: relative;
  z-index: 1100;
}

.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 32, 0.45);
}

.confirm-dialog-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.confirm-panel {
  width: min(100%, 24rem);
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.confirm-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-color);
}

.confirm-close-icon {
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

.confirm-close-icon:hover:not(:disabled) {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.confirm-close-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-message {
  margin: 0 0 1.25rem;
  font-size: 0.92rem;
  line-height: 1.5;
  color: #555;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  padding: 0 0.9em;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  box-sizing: border-box;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-danger {
  background-color: #b81727;
  color: #fff;
  border: 1px solid #b81727;
}

.confirm-danger:hover:not(:disabled) {
  background-color: #9a1320;
  border-color: #9a1320;
}
</style>
