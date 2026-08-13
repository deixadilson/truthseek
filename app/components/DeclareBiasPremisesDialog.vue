<template>
  <Dialog :open="open" @close="handleDismiss" class="declare-bias-dialog-root">
    <div class="declare-bias-backdrop" aria-hidden="true" />

    <div class="declare-bias-dialog-container">
      <DialogPanel class="declare-bias-panel">
        <div class="declare-bias-header">
          <DialogTitle class="declare-bias-title">
            Declarar viés{{ groupName ? `: ${groupName}` : '' }}
          </DialogTitle>
          <button
            type="button"
            class="declare-bias-close"
            title="Fechar"
            :disabled="busy"
            @click="handleDismiss"
          >
            <Icon name="lucide:x" :size="18" />
          </button>
        </div>

        <p class="declare-bias-intro">
          Para declarar este viés, confirme que você concorda com as premissas abaixo.
        </p>

        <div v-if="isLoading" class="declare-bias-loading">
          <LoadingMessage message="Carregando premissas..." :icon-size="18" />
        </div>

        <p v-else-if="loadError" class="declare-bias-error">{{ loadError }}</p>

        <p v-else-if="premises.length === 0" class="declare-bias-empty">
          Este viés ainda não possui premissas cadastradas.
        </p>

        <ul v-else class="premises-list">
          <li v-for="premise in premises" :key="premise.id" class="premise-item">
            <label class="premise-label">
              <input
                v-model="checkedIds"
                type="checkbox"
                class="premise-checkbox"
                :value="premise.id"
                :disabled="busy"
              >
              <span class="premise-text">
                <span class="premise-name">{{ premise.name }}</span>
                <span v-if="premise.description" class="premise-description">
                  {{ premise.description }}
                </span>
              </span>
            </label>
          </li>
        </ul>

        <p class="declare-bias-hint">
          Marque todas as premissas para continuar.
        </p>

        <div class="declare-bias-actions">
          <button
            type="button"
            class="button-secondary declare-bias-btn"
            :disabled="busy"
            @click="handleDismiss"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="button-primary declare-bias-btn"
            :class="{ 'declare-bias-btn--ready': canConfirm && !busy }"
            :disabled="!canConfirm || busy"
            :title="canConfirm ? undefined : 'Marque todas as premissas para continuar'"
            @click="emit('confirm')"
          >
            <LoadingMessage v-if="busy" message="Declarando..." :icon-size="14" />
            <template v-else>Declarar viés</template>
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import type { Database } from '~/types/supabase';

type PremiseRow = Database['public']['Tables']['premises']['Row'];

const props = defineProps<{
  open: boolean;
  groupId: string | null;
  groupName?: string | null;
  busy?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const supabase = useSupabaseClient<Database>();

const premises = ref<PremiseRow[]>([]);
const checkedIds = ref<string[]>([]);
const isLoading = ref(false);
const loadError = ref<string | null>(null);

const allChecked = computed(() => {
  if (premises.value.length === 0) return false;
  return premises.value.every((p) => checkedIds.value.includes(p.id));
});

const canConfirm = computed(() => {
  return (
    !isLoading.value
    && !loadError.value
    && premises.value.length > 0
    && allChecked.value
  );
});

async function loadPremises(groupId: string) {
  isLoading.value = true;
  loadError.value = null;
  premises.value = [];
  checkedIds.value = [];

  try {
    const { data, error } = await supabase
      .from('premises')
      .select('id, group_id, name, description, sort_order, axis_key, created_at')
      .eq('group_id', groupId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    premises.value = data || [];
  } catch (e: any) {
    loadError.value = e.message || 'Não foi possível carregar as premissas.';
  } finally {
    isLoading.value = false;
  }
}

function handleDismiss() {
  if (props.busy) return;
  emit('close');
}

watch(
  () => [props.open, props.groupId] as const,
  ([open, groupId]) => {
    if (open && groupId) {
      void loadPremises(groupId);
    }
    if (!open) {
      premises.value = [];
      checkedIds.value = [];
      loadError.value = null;
    }
  },
);
</script>

<style scoped>
.declare-bias-dialog-root {
  position: relative;
  z-index: 100;
}

.declare-bias-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.45);
}

.declare-bias-dialog-container {
  position: fixed;
  inset: 0;
  z-index: 1101;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.declare-bias-panel {
  width: min(100%, 34rem);
  max-height: min(90vh, 40rem);
  overflow-y: auto;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  padding: 1.25rem 1.35rem 1.15rem;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}

.declare-bias-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.declare-bias-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary, #0f172a);
  line-height: 1.35;
}

.declare-bias-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
}

.declare-bias-close:hover:not(:disabled) {
  background: var(--color-surface-muted, #f1f5f9);
  color: var(--color-text-primary, #0f172a);
}

.declare-bias-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.declare-bias-intro {
  margin: 0 0 1rem;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--color-text-secondary, #475569);
}

.declare-bias-loading,
.declare-bias-error,
.declare-bias-empty {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary, #64748b);
}

.declare-bias-error {
  color: #b91c1c;
}

.premises-list {
  list-style: none;
  margin: 0 0 0.85rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.premise-item {
  margin: 0;
}

.premise-label {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.premise-label:hover {
  border-color: var(--color-primary, #2563eb);
  background: rgba(37, 99, 235, 0.04);
}

.premise-checkbox {
  margin-top: 0.2rem;
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
  accent-color: var(--color-primary, #2563eb);
  cursor: pointer;
}

.premise-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.premise-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary, #0f172a);
  line-height: 1.35;
}

.premise-description {
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-text-secondary, #64748b);
}

.declare-bias-hint {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  color: var(--color-text-secondary, #64748b);
}

.declare-bias-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.declare-bias-btn {
  min-width: 7.5rem;
}

.declare-bias-btn.button-primary:disabled,
.declare-bias-btn.button-primary:disabled:hover,
.declare-bias-btn.button-primary:disabled:focus {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  filter: grayscale(0.35);
}

.declare-bias-btn--ready:not(:disabled) {
  opacity: 1;
  filter: none;
  box-shadow: 0 4px 14px var(--button-shadow-color, rgba(37, 99, 235, 0.35));
}

@media (max-width: 480px) {
  .declare-bias-actions {
    flex-direction: column-reverse;
  }

  .declare-bias-btn {
    width: 100%;
  }
}
</style>
