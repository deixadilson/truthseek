<template>
  <div class="confirm-page container">
    <div class="confirm-card">
      <h2>{{ title }}</h2>

      <div v-if="status === 'loading'" class="confirm-body">
        <LoadingMessage message="Confirmando sua conta..." />
        <p class="hint">Aguarde enquanto validamos o link.</p>
      </div>

      <div v-else-if="status === 'success'" class="confirm-body success">
        <Icon name="lucide:circle-check" :size="40" class="status-icon success" />
        <p>{{ successMessage }}</p>
        <p class="hint">Redirecionando...</p>
      </div>

      <div v-else class="confirm-body error">
        <Icon name="lucide:circle-alert" :size="40" class="status-icon error" />
        <p>{{ errorMessage }}</p>
        <div class="actions">
          <NuxtLink to="/user/login" class="button-primary">Ir para o login</NuxtLink>
          <NuxtLink to="/user/register" class="button-secondary">Criar conta</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Confirmação - TruthSeek Network' });

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const route = useRoute();

type ConfirmStatus = 'loading' | 'success' | 'error';

const status = ref<ConfirmStatus>('loading');
const errorMessage = ref('Não foi possível confirmar sua conta. O link pode estar inválido ou expirado.');
const successMessage = ref('Conta confirmada com sucesso!');
const redirected = ref(false);

let authSubscription: { unsubscribe: () => void } | null = null;
let timeoutId: number | null = null;
let stopWatch: (() => void) | null = null;

const title = computed(() => {
  if (status.value === 'success') return 'Tudo certo!';
  if (status.value === 'error') return 'Falha na confirmação';
  return 'Confirmando...';
});

function queryError(): string | null {
  const error = route.query.error;
  const description = route.query.error_description || route.query.error_code;
  if (typeof error === 'string' && error) {
    if (typeof description === 'string' && description) {
      return decodeURIComponent(description.replace(/\+/g, ' '));
    }
    return 'O link de confirmação é inválido ou expirou.';
  }
  return null;
}

function resolveRedirectPath(): string {
  try {
    const redirectInfo = useSupabaseCookieRedirect();
    return redirectInfo.pluck() || '/';
  } catch {
    return '/';
  }
}

async function redirectAfterSuccess(event?: string | null) {
  if (redirected.value || status.value === 'error') return;
  redirected.value = true;

  if (event === 'PASSWORD_RECOVERY') {
    successMessage.value = 'Link de recuperação validado. Defina sua nova senha.';
    status.value = 'success';
    await navigateTo('/user/password-reset');
    return;
  }

  successMessage.value = 'Conta confirmada com sucesso!';
  status.value = 'success';

  const path = resolveRedirectPath();
  await new Promise((resolve) => setTimeout(resolve, 700));
  await navigateTo(path);
}

onMounted(() => {
  const fromQuery = queryError();
  if (fromQuery) {
    errorMessage.value = fromQuery;
    status.value = 'error';
    return;
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) return;

    if (event === 'PASSWORD_RECOVERY') {
      await redirectAfterSuccess('PASSWORD_RECOVERY');
      return;
    }

    if (
      event === 'SIGNED_IN'
      || event === 'INITIAL_SESSION'
      || event === 'TOKEN_REFRESHED'
      || event === 'USER_UPDATED'
    ) {
      await redirectAfterSuccess(event);
    }
  });
  authSubscription = subscription;

  stopWatch = watch(
    user,
    async (value) => {
      if (value) {
        await redirectAfterSuccess(null);
      }
    },
    { immediate: true }
  );

  timeoutId = window.setTimeout(() => {
    if (!user.value && status.value === 'loading') {
      errorMessage.value = 'Não foi possível confirmar o link a tempo. Solicite um novo e-mail de confirmação ou tente fazer login.';
      status.value = 'error';
    }
  }, 12000);
});

onUnmounted(() => {
  authSubscription?.unsubscribe();
  stopWatch?.();
  if (timeoutId != null) window.clearTimeout(timeoutId);
});
</script>

<style scoped>
.confirm-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px - 3rem);
}

.confirm-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.confirm-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 1.25rem;
}

.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.confirm-body p {
  margin: 0;
  color: var(--text-color);
  line-height: 1.5;
}

.hint {
  color: #666 !important;
  font-size: 0.92rem;
}

.status-icon.success {
  color: #15803d;
}

.status-icon.error {
  color: #b91c1c;
}

.confirm-body.error p {
  color: #7f1d1d;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  margin-top: 0.75rem;
}

.actions .button-primary,
.actions .button-secondary {
  min-width: 9rem;
  text-align: center;
}
</style>
