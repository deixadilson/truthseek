<template>
  <div class="password-recovery-page container">
    <div class="recovery-card">
      <h2>Recuperar Senha</h2>
      <p>
        Digite seu endereço de email abaixo e enviaremos um link para
        redefinir sua senha.
      </p>

      <form @submit.prevent="handlePasswordRecovery" class="recovery-form">
        <div class="form-group">
          <label for="email">Email:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="seu.email@exemplo.com"
          />
        </div>

        <button type="submit" class="button-primary recovery-button" :disabled="isLoading">
          {{ isLoading ? 'Enviando...' : 'Enviar Link de Recuperação' }}
        </button>
      </form>
      <div class="action-links">
        <NuxtLink to="/user/login">Voltar para o Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { AuthError } from '@supabase/supabase-js';

const supabase = useSupabaseClient();
const toast = useToast();

const email = ref('');
const isLoading = ref(false);

async function handlePasswordRecovery(): Promise<void> {
  isLoading.value = true;
  try {
    const redirectUrl = `${window.location.origin}/user/password-reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      if (error instanceof AuthError) {
        toast.error(error.message || 'Falha ao enviar link de recuperação.');
      } else {
        toast.error('Ocorreu um erro desconhecido.');
      }
    } else {
      toast.success('Se uma conta com este email existir, um link de recuperação foi enviado. Verifique sua caixa de entrada (e spam).');
    }
  } catch (e: any) {
    console.error('Erro inesperado:', e);
    toast.error(e.message || 'Ocorreu um erro inesperado.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.password-recovery-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px - 3rem);
}

.recovery-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.recovery-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 0.75rem;
}

.recovery-card p {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.recovery-form .form-group {
  margin-bottom: 1.5rem;
}

.recovery-form label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.recovery-form input[type="email"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
}

.recovery-form input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.recovery-button {
  width: 100%;
  padding: 0.9rem;
  font-size: 1.1rem;
  font-weight: 500;
}
.action-links {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>
