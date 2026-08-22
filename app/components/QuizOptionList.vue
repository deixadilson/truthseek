<template>
  <div class="quiz-options" role="listbox" :aria-label="ariaLabel">
    <button
      v-for="opt in options"
      :key="opt.id"
      type="button"
      class="quiz-options-item"
      :class="{ selected: modelValue === opt.group_id }"
      role="option"
      :aria-selected="modelValue === opt.group_id"
      @click="emit('update:modelValue', opt.group_id)"
    >
      <span class="quiz-options-radio" aria-hidden="true" />
      <span class="quiz-options-label">{{ opt.label }}</span>
      <Icon
        v-if="modelValue === opt.group_id"
        name="lucide:check"
        :size="18"
        class="quiz-options-check"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { QuizChoiceOption } from '~/utils/quizScoring';

defineProps<{
  options: QuizChoiceOption[];
  modelValue: string | null;
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<style scoped>
.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-options-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: #fff;
  color: var(--text-color);
  font: inherit;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.quiz-options-item:hover {
  border-color: var(--primary-color);
}

.quiz-options-item.selected {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color-light) 55%, #fff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 25%, transparent);
  font-weight: 600;
}

.quiz-options-radio {
  flex: 0 0 1.1rem;
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.15rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--text-color) 25%, transparent);
  background: #fff;
  box-shadow: inset 0 0 0 0 var(--primary-color);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.quiz-options-item.selected .quiz-options-radio {
  border-color: var(--primary-color);
  box-shadow: inset 0 0 0 0.28rem var(--primary-color);
}

.quiz-options-label {
  flex: 1;
  line-height: 1.4;
}

.quiz-options-check {
  flex: 0 0 auto;
  margin-top: 0.1rem;
  color: #2e7d32;
}
</style>
