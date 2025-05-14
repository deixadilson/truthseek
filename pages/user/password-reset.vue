<template>
  <div class="password-reset-page container">
    <div class="reset-card">
      <h2>Redefinir sua Senha</h2>

      <!-- O formulário só aparece se canResetPassword for true -->
      <form v-if="canResetPassword" @submit.prevent="handlePasswordReset" class="reset-form">
        <p>Digite sua nova senha abaixo.</p>
        <div class="form-group">
          <label for="newPassword">Nova Senha:</label>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            required
            minlength="8"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div class="form-group">
          <label for="confirmNewPassword">Confirmar Nova Senha:</label>
          <input
            type="password"
            id="confirmNewPassword"
            v-model="confirmNewPassword"
            required
          />
        </div>
        <button type="submit" class="button-primary reset-button" :disabled="isLoading">
          {{ isLoading ? 'Redefinindo...' : 'Redefinir Senha' }}
        </button>
      </form>

      <!-- Mensagem enquanto o link é processado ou se algo deu errado com o link -->
      <div v-if="!canResetPassword && !processCompleted && !initialError" class="loading-info">
        Processando seu link de recuperação...
      </div>
      <div v-if="initialError" class="error-message-placeholder"> <!-- Placeholder para erro inicial do link -->
        <p>{{ initialError }}</p>
        <NuxtLink to="/user/password-recovery" class="button-secondary">Solicitar Novo Link</NuxtLink>
      </div>


      <!-- Link para login após sucesso -->
      <div class="action-links" v-if="processCompleted && !initialError">
        <p>Sua senha foi redefinida com sucesso!</p>
        <NuxtLink to="/user/login" class="button-primary">Ir para o Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { AuthError } from '@supabase/supabase-js';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

const newPassword = ref('');
const confirmNewPassword = ref('');
const isLoading = ref(false);
const canResetPassword = ref(false); // Controla a exibição do formulário
const processCompleted = ref(false); // Indica se o processo de reset (bem-sucedido ou não) terminou
const initialError = ref<string | null>(null); // Para erros ao processar o link inicial

let authSubscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null;

onMounted(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth Event (Password Reset):', event); // Para debug

    if (event === 'PASSWORD_RECOVERY' && session) {
      toast.info('Você agora pode definir uma nova senha.');
      canResetPassword.value = true;
      initialError.value = null; // Limpa erro inicial se houver
    } else if (session && !canResetPassword.value && !processCompleted.value) {
      // Usuário já logado e não veio de um link de recuperação
      // (ou o evento PASSWORD_RECOVERY já passou e a sessão foi estabelecida)
      // Se ele tem uma sessão válida, mas não ativou o canResetPassword,
      // talvez ele não devesse estar aqui, a menos que seja o mesmo usuário.
      // Por segurança, não habilitamos o reset se não passar pelo evento PASSWORD_RECOVERY.
      // Poderíamos redirecionar ou apenas não mostrar o formulário.
      initialError.value = 'Link inválido ou você já está conectado com outra sessão.';
      canResetPassword.value = false;
    } else if (!session && event !== 'INITIAL_SESSION' && !processCompleted.value) {
      // Se não há sessão e não é o evento inicial (e o processo não foi completado)
      // pode ser um link expirado ou inválido.
      if (!canResetPassword.value) { // Só mostra erro se o formulário nunca foi habilitado
        initialError.value = 'Link de recuperação inválido ou expirado. Por favor, solicite um novo.';
        toast.error(initialError.value);
      }
    }
  });
  authSubscription = subscription;
});

onUnmounted(() => {
  if (authSubscription) {
    authSubscription.unsubscribe();
  }
});

async function handlePasswordReset(): Promise<void> {
  if (newPassword.value !== confirmNewPassword.value) {
    toast.error('As senhas não coincidem.');
    return;
  }
  if (newPassword.value.length < 8) {
    toast.error('A nova senha deve ter no mínimo 8 caracteres.');
    return;
  }

  isLoading.value = true;

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    });

    if (error) {
      console.error('Erro ao redefinir senha:', error);
      if (error instanceof AuthError) {
        toast.error(error.message || 'Falha ao redefinir senha.');
      } else {
        toast.error('Ocorreu um erro desconhecido ao redefinir a senha.');
      }
    } else {
      toast.success('Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.');
      canResetPassword.value = false; // Esconder o formulário
      processCompleted.value = true; // Indicar que o processo terminou
      // Opcional: deslogar explicitamente se o updateUser não invalidar a sessão de recuperação
      // await supabase.auth.signOut();
    }
  } catch (e: any) {
    console.error('Erro inesperado ao redefinir senha:', e);
    toast.error(e.message || 'Ocorreu um erro inesperado.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.password-reset-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px - 3rem);
}

.reset-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.reset-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 1rem;
}
.reset-card p {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
}

.reset-form .form-group {
  margin-bottom: 1.2rem;
}
.reset-form label {
  display: block; margin-bottom: 0.4rem; font-weight: 500; font-size: 0.9rem;
}
.reset-form input[type="password"] {
  width: 100%; padding: 0.8rem; border: 1px solid var(--border-color);
  border-radius: 4px; font-size: 1rem; background-color: #fff;
}
.reset-form input:focus {
  outline: none; border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.reset-button {
  width: 100%;
  padding: 0.9rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.loading-info {
  text-align: center;
  padding: 1rem 0;
  color: #666;
  font-style: italic;
}
.error-message-placeholder {
  text-align: center;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
.error-message-placeholder p {
  margin-bottom: 0.75rem;
  color: #721c24;
}


.action-links {
  margin-top: 1.5rem;
  text-align: center;
}
.action-links p {
  margin-bottom: 1rem;
  color: var(--text-color);
  font-size: 1rem;
}
</style>
