<!-- pages/user/profile.vue -->
<template>
  <div class="profile-page container">
    <div v-if="isLoading" class="loading-spinner">Carregando perfil...</div>
    <div v-else-if="profileError" class="error-message">
      {{ profileError || 'Não foi possível carregar o perfil.' }}
    </div>
    <div v-else-if="user && profileData" class="profile-card">
      <h2>Seu Perfil</h2>

      <div class="avatar-section">
        <img
          :src="profileData.avatar_path || defaultAvatarUrl"
          alt="Avatar do usuário"
          class="profile-avatar"
        />
        <!-- Funcionalidade de upload será adicionada depois -->
        <button @click="handleUploadPlaceholder" class="button-secondary upload-button">
          Alterar Avatar (Em breve)
        </button>
      </div>

      <div class="profile-info">
        <div class="info-item">
          <strong>ID do Usuário:</strong>
          <span>{{ user.id }}</span>
        </div>
        <div class="info-item">
          <strong>Email:</strong>
          <span>{{ user.email }}</span>
        </div>
        <div class="info-item">
          <strong>Nome de Usuário:</strong>
          <span>{{ profileData.username }}</span>
        </div>
        <div class="info-item" v-if="profileData.country_code">
          <strong>País:</strong>
          <span>{{ profileData.country_code }}</span> <!-- Exibir código, idealmente nome do país -->
        </div>
        <div class="info-item" v-if="profileData.gender">
          <strong>Sexo:</strong>
          <span>{{ formatGender(profileData.gender) }}</span>
        </div>
        <div class="info-item" v-if="profileData.birth_date">
          <strong>Data de Nascimento:</strong>
          <span>{{ formatDate(profileData.birth_date) }}</span>
        </div>
         <div class="info-item">
          <strong>Membro desde:</strong>
          <span>{{ formatDate(profileData.created_at, true) }}</span>
        </div>
      </div>
      <!-- Outras seções do perfil virão aqui (vieses, debates, etc.) -->
    </div>
    <div v-else>
      <p>Você precisa estar logado para ver seu perfil.</p>
      <NuxtLink to="/user/login" class="button-primary">Fazer Login</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();

const profileData = ref<Profile | null>(null);
const isLoading = ref(true);
const profileError = ref<string | null>(null);

const defaultAvatarUrl = '/images/default-avatar.png';

async function fetchProfile(): Promise<void> {
  isLoading.value = true;
  profileError.value = null;

  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select(`id, username, avatar_path, country_code, gender, birth_date, created_at`)
      .eq('id', user.value.id)
      .single();
    if (error) throw error;
    profileData.value = data;
  } catch (e: any) {
    console.error('Erro ao buscar perfil:', e);
    profileError.value = e.message || 'Falha ao carregar dados do perfil.';
    toast.error(profileError.value);
  } finally {
    isLoading.value = false;
  }
}

// Funções de formatação
function formatGender(genderCode: string | null | undefined): string {
  if (genderCode === 'm') return 'Masculino';
  if (genderCode === 'f') return 'Feminino';
  return 'Não informado';
}

function formatDate(dateString: string | null | undefined, includeTime: boolean = false): string {
  if (!dateString) return 'Não informada';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida'; // Verifica se a data é válida
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long', // 'short' para mês abreviado, '2-digit' para numérico
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.error("Erro ao formatar data:", dateString, error);
    return dateString; // Retorna a string original em caso de erro
  }
}

function handleUploadPlaceholder(): void {
  toast.info('Funcionalidade de upload de avatar em desenvolvimento!');
}

// Buscar perfil quando o componente é montado e o usuário está disponível
onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.profile-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
}

.profile-card {
  background-color: var(--card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.07);
  max-width: 700px;
  margin: 0 auto;
}

.profile-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 2rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-color);
  background-color: #f0f0f0;
}

.upload-button {
  font-size: 0.9em;
}

.profile-info {
  display: grid;
  /* grid-template-columns: auto 1fr; */ /* Label e valor */
  gap: 1rem;
}

.info-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}
.info-item:last-child {
  border-bottom: none;
}

.info-item strong {
  color: var(--text-color);
  margin-right: 0.5rem;
}
.info-item span {
  color: #555;
  text-align: right;
}

.loading-spinner, .error-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}
.error-message {
  color: #dc3545; /* Cor de erro */
  background-color: color-mix(in srgb, #dc3545 15%, transparent);
  border: 1px solid color-mix(in srgb, #dc3545 30%, transparent);
  border-radius: 4px;
}
</style>