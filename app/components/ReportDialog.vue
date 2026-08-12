<template>
  <Dialog :open="open" @close="handleDismiss" class="report-dialog-root">
    <div class="report-backdrop" aria-hidden="true" />

    <div class="report-dialog-container">
      <DialogPanel class="report-panel">
        <div class="report-header">
          <DialogTitle class="report-title">Denunciar {{ targetLabel }}</DialogTitle>
          <button
            type="button"
            class="report-close-icon"
            title="Fechar"
            :disabled="isSubmitting"
            @click="handleDismiss"
          >
            <Icon name="lucide:x" :size="18" />
          </button>
        </div>

        <p class="report-intro">
          Selecione o motivo da denúncia. Denúncias abusivas podem prejudicar sua conta.
        </p>

        <form class="report-form" @submit.prevent="submitReport">
          <fieldset class="report-types" :disabled="isSubmitting">
            <legend class="sr-only">Motivo</legend>
            <label
              v-for="option in availableTypes"
              :key="option.value"
              class="report-type-option"
              :class="{ selected: reportType === option.value }"
            >
              <input
                v-model="reportType"
                type="radio"
                name="report-type"
                :value="option.value"
                required
              />
              <span class="type-label">{{ option.label }}</span>
              <span class="type-hint">{{ option.hint }}</span>
            </label>
          </fieldset>

          <p v-if="!isModerated" class="report-note">
            Denúncias de ofensas são aceitas apenas em conteúdos marcados como moderado.
          </p>

          <div class="form-group">
            <label for="report-description">Detalhes (opcional)</label>
            <textarea
              id="report-description"
              v-model="description"
              rows="3"
              maxlength="1000"
              placeholder="Descreva o problema, se necessário."
              :disabled="isSubmitting"
            ></textarea>
            <span class="char-count">{{ description.length }}/1000</span>
          </div>

          <div class="report-actions">
            <button
              type="button"
              class="button-secondary report-btn"
              :disabled="isSubmitting"
              @click="handleDismiss"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="button-primary report-btn"
              :disabled="isSubmitting || !reportType"
            >
              <LoadingMessage v-if="isSubmitting" message="Enviando..." :icon-size="14" />
              <template v-else>Enviar denúncia</template>
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import type { Database } from '~/types/supabase';
import { useToast } from 'vue-toastification';

export type ReportType = 'nsfw' | 'gore' | 'offense' | 'spam' | 'off-topic';

const props = defineProps<{
  open: boolean;
  targetType: 'post' | 'comment';
  targetId: string;
  isModerated?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'submitted'): void;
}>();

const supabase = useSupabaseClient<Database>();
const toast = useToast();

const reportType = ref<ReportType | ''>('');
const description = ref('');
const isSubmitting = ref(false);

const targetLabel = computed(() => (props.targetType === 'post' ? 'post' : 'comentário'));

const allTypes: { value: ReportType; label: string; hint: string; requiresModerated?: boolean }[] = [
  { value: 'spam', label: 'Spam', hint: 'Propaganda, flooding ou conteúdo repetitivo.' },
  { value: 'off-topic', label: 'Off-topic', hint: 'Não relacionado ao grupo ou discussão.' },
  { value: 'nsfw', label: 'NSFW', hint: 'Conteúdo sexual ou inadequado.' },
  { value: 'gore', label: 'Gore', hint: 'Imagens ou descrições de violência extrema.' },
  { value: 'offense', label: 'Ofensa', hint: 'Apenas em conteúdo marcado como moderado.', requiresModerated: true },
];

const availableTypes = computed(() =>
  allTypes.filter((t) => !t.requiresModerated || props.isModerated)
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      reportType.value = '';
      description.value = '';
      isSubmitting.value = false;
    }
  }
);

function handleDismiss() {
  if (isSubmitting.value) return;
  emit('update:open', false);
}

async function submitReport() {
  if (!props.targetId || !reportType.value) return;
  isSubmitting.value = true;
  try {
    const { error } = await supabase.rpc('create_report', {
      p_target_type: props.targetType,
      p_target_id: props.targetId,
      p_report_type: reportType.value,
      p_description: description.value.trim() || null,
    });
    if (error) throw error;
    toast.success('Denúncia enviada. Obrigado.');
    emit('submitted');
    emit('update:open', false);
  } catch (e: any) {
    toast.error(e.message || 'Falha ao enviar denúncia.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.report-dialog-root {
  position: relative;
  z-index: 1100;
}

.report-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 32, 0.45);
}

.report-dialog-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.report-panel {
  width: min(100%, 28rem);
  max-height: min(90vh, 40rem);
  overflow-y: auto;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.report-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--primary-color);
}

.report-close-icon {
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

.report-close-icon:hover:not(:disabled) {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.report-close-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-intro {
  margin: 0 0 1rem;
  font-size: 0.88rem;
  color: #666;
  line-height: 1.45;
}

.report-types {
  border: none;
  margin: 0 0 0.75rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.report-type-option {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.55rem;
  row-gap: 0.1rem;
  align-items: center;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
}

.report-type-option input {
  grid-row: 1 / -1;
  align-self: center;
  margin: 0;
}

.report-type-option.selected {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color-light) 55%, transparent);
}

.type-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.type-hint {
  font-size: 0.78rem;
  color: #777;
  line-height: 1.35;
}

.report-note {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  color: #777;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-group textarea {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font: inherit;
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.char-count {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #888;
  text-align: right;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.report-btn {
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
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
