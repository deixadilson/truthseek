<template>
  <button
    type="button"
    class="favorite-group-btn"
    :class="{ active: favorited, busy: isBusy }"
    :title="favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
    :aria-label="favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
    :aria-pressed="favorited"
    :disabled="isBusy || !targetId"
    @click.stop="onClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      class="favorite-star-icon"
      aria-hidden="true"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification'
import type { FavoriteTargetType } from '~/composables/useGroupShortcuts'

const props = withDefaults(
  defineProps<{
    targetType: FavoriteTargetType
    targetId: string | null | undefined
    size?: number
  }>(),
  { size: 22 },
)

const toast = useToast()
const authUserId = useAuthUserId()
const { isFavorite, toggleFavorite, ensureLoaded } = useGroupShortcuts()
const isBusy = ref(false)

const favorited = computed(() => {
  if (!props.targetId) return false
  return isFavorite(props.targetType, props.targetId)
})

watch(
  authUserId,
  (id) => {
    if (id) void ensureLoaded()
  },
  { immediate: true },
)

async function onClick() {
  if (!props.targetId || isBusy.value) return

  if (!authUserId.value) {
    toast.info('Faça login para favoritar grupos.')
    await navigateTo('/user/login')
    return
  }

  isBusy.value = true
  try {
    const nowFavorite = await toggleFavorite(props.targetType, props.targetId)
    toast.success(nowFavorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.')
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível atualizar o favorito.')
  } finally {
    isBusy.value = false
  }
}
</script>

<style scoped>
.favorite-group-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem;
  margin: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--header-text);
  cursor: pointer;
  flex-shrink: 0;
  line-height: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
  transition: color 0.15s, transform 0.15s, opacity 0.15s;
}

.favorite-group-btn:hover:not(:disabled) {
  transform: scale(1.08);
  opacity: 0.92;
}

.favorite-group-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.favorite-star-icon {
  display: block;
}

.favorite-star-icon path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.favorite-group-btn.active {
  color: #f5c518;
}

.favorite-group-btn.active .favorite-star-icon path {
  fill: currentColor;
  stroke: currentColor;
}
</style>
