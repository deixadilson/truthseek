<template>
  <div class="signup-page container">
    <div class="signup-card">
      <h2>Criar meu perfil</h2>
      <p>Escolha como deseja se cadastrar na TruthSeek Network.</p>

      <button
        type="button"
        class="google-button"
        :disabled="isGoogleLoading"
        @click="handleGoogle"
      >
        <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <LoadingMessage v-if="isGoogleLoading" message="Redirecionando..." :icon-size="16" />
        <span v-else>Continuar com Google</span>
      </button>

      <div class="divider" role="separator">
        <span>ou</span>
      </div>

      <NuxtLink :to="registerPath" class="button-primary email-button">
        Cadastrar com e-mail e senha
      </NuxtLink>

      <div class="login-link">
        Já tem uma conta? <NuxtLink to="/user/login">Faça login</NuxtLink>.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

useHead({ title: 'Criar perfil - TruthSeek Network' });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const user = useSupabaseUser();
const userProfile = useProfile();
const { signInWithGoogle } = useGoogleAuth();
const isGoogleLoading = ref(false);

const redirectTarget = computed(() => {
  const value = route.query.redirect;
  return typeof value === 'string' && value.startsWith('/') ? value : null;
});

const registerPath = computed(() => {
  if (!redirectTarget.value) return '/user/register';
  return `/user/register?redirect=${encodeURIComponent(redirectTarget.value)}`;
});

watch(
  [user, userProfile],
  ([authUser, profile]) => {
    if (!authUser) return;
    if (profile && isProfileComplete(profile)) {
      void router.replace(redirectTarget.value || '/');
      return;
    }
    if (profile && !isProfileComplete(profile)) {
      void router.replace('/user/complete-profile');
    }
  },
  { immediate: true },
);

async function handleGoogle() {
  isGoogleLoading.value = true;
  try {
    if (redirectTarget.value && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('ts_post_auth_redirect', redirectTarget.value);
    }

    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Erro no Google OAuth:', error);
      toast.error(error.message || 'Não foi possível iniciar o cadastro com Google.');
      isGoogleLoading.value = false;
    }
  } catch (e: any) {
    console.error('Erro inesperado no Google OAuth:', e);
    toast.error(e?.message || 'Ocorreu um erro inesperado.');
    isGoogleLoading.value = false;
  }
}
</script>

<style scoped>
.signup-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px - 3rem);
}

.signup-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.signup-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.signup-card > p {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
}

.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: #3c4043;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.google-button:hover:not(:disabled) {
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.google-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: #888;
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.email-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.9rem;
  font-size: 1.05rem;
  font-weight: 500;
  text-decoration: none;
  box-sizing: border-box;
}

.login-link {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>
