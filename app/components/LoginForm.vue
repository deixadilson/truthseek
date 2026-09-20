<template>
  <form class="login-form" @submit.prevent="handleLogin">
    <div class="form-group">
      <label for="login-email">Email:</label>
      <input
        id="login-email"
        v-model="email"
        type="email"
        required
        placeholder="seu.email@exemplo.com"
      />
    </div>

    <div class="form-group">
      <label for="login-password">Senha:</label>
      <input
        id="login-password"
        v-model="password"
        type="password"
        required
        placeholder="Sua senha"
      />
    </div>

    <button type="submit" class="button-primary login-button" :disabled="isLoading">
      <LoadingMessage v-if="isLoading" message="Entrando..." :icon-size="16" />
      <template v-else>Entrar</template>
    </button>

    <div class="divider" role="separator">
      <span>ou</span>
    </div>

    <button
      type="button"
      class="google-button"
      :disabled="isGoogleLoading || isLoading"
      @click="handleGoogle"
    >
      <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <LoadingMessage v-if="isGoogleLoading" message="Redirecionando..." :icon-size="16" />
      <span v-else>Entrar com Google</span>
    </button>
  </form>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { signInWithGoogle } = useGoogleAuth();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const isGoogleLoading = ref(false);

function authErrorMessage(error: { message?: string; code?: string } | null): string {
  const message = (error?.message || '').toLowerCase();
  const code = (error?.code || '').toLowerCase();

  if (
    code === 'email_not_confirmed'
    || message.includes('email not confirmed')
    || message.includes('email_not_confirmed')
  ) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e o spam) e clique no link de confirmação para ativar a conta.';
  }

  if (
    code === 'invalid_credentials'
    || message.includes('invalid login credentials')
    || message.includes('invalid credentials')
  ) {
    return 'E-mail ou senha inválidos.';
  }

  return error?.message || 'Falha ao tentar fazer login.';
}

async function handleLogin(): Promise<void> {
  isLoading.value = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) {
      console.error('Erro no Login:', error);
      toast.error(authErrorMessage(error));
      return;
    }

    if (data.user && data.session) {
      toast.success('Login realizado com sucesso!');
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender, birth_date')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!isProfileComplete(profile)) {
        await router.push('/user/complete-profile');
        return;
      }

      await router.push('/');
      return;
    }

    toast.error('Não foi possível completar o login. Tente novamente.');
  } catch (e: any) {
    console.error('Erro inesperado no handleLogin:', e);
    toast.error(e?.message || 'Ocorreu um erro inesperado no login.');
  } finally {
    isLoading.value = false;
  }
}

async function handleGoogle(): Promise<void> {
  isGoogleLoading.value = true;
  try {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Erro no Google OAuth:', error);
      toast.error(error.message || 'Não foi possível iniciar o login com Google.');
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
.login-form .form-group {
  margin-bottom: 1.2rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.login-form input[type="email"],
.login-form input[type="password"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
}

.login-form input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.login-button {
  width: 100%;
  padding: 0.9rem;
  font-size: 1.1rem;
  font-weight: 500;
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
</style>
