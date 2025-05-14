<template>
  <form @submit.prevent="handleLogin" class="login-form">
  <div class="form-group">
    <label for="email">Email:</label>
    <input
      type="email"
      id="login-email"
      v-model="email"
      required
      placeholder="seu.email@exemplo.com"
    />
  </div>

  <div class="form-group">
    <label for="password">Senha:</label>
    <input
      type="password"
      id="login-password"
      v-model="password"
      required
      placeholder="Sua senha"
    />
  </div>

  <button type="submit" class="button-primary login-button" :disabled="isLoading">
    {{ isLoading ? 'Entrando...' : 'Entrar' }}
  </button>
</form>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { AuthError } from '@supabase/supabase-js';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

// --- State ---
const email = ref('');
const password = ref('');
const isLoading = ref(false);

// --- Methods ---
async function handleLogin(): Promise<void> {
  isLoading.value = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      console.error('Erro no Login:', error);
      if (error instanceof AuthError) {
        if (error.message.includes('Email not confirmed')) {
          toast.warning('Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha inválidos.');
        }
        else {
          toast.error(error.message || 'Falha ao tentar fazer login.');
        }
      } else {
        toast.error('Ocorreu um erro desconhecido durante o login.');
      }
      isLoading.value = false;
      return;
    }

    if (data.user && data.session) {
      toast.success('Login realizado com sucesso!');
      router.push('/');
    } else {
      toast.error('Não foi possível completar o login. Tente novamente.');
    }
  } catch (e: any) {
    console.error('Erro inesperado no handleLogin:', e);
    toast.error(e.message || 'Ocorreu um erro inesperado no login.');
  } finally {
    isLoading.value = false;
  }
};
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
</style>
