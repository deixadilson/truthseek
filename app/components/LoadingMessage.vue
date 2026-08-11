<template>
  <div class="loading-message" :class="wrapperClass">
    <Icon name="lucide:loader-circle" class="loading-icon" :size="iconSize" />
    <span>{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string;
  iconSize?: number | string;
  wrapperClass?: string;
}>(), {
  message: 'Carregando...',
  iconSize: 20,
  wrapperClass: '',
});
</script>

<style scoped>
.loading-message {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  color: inherit;
}

.loading-icon {
  flex-shrink: 0;
  color: inherit;
  animation: loading-spin 0.8s linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
