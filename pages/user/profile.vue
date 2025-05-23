<template>
  <div class="profile-page container">
    <div v-if="!userProfile" class="loading-spinner">Carregando perfil...</div>
    <div v-else class="profile-card">
      <h2>Seu Perfil</h2>

      <div class="avatar-section">
        <img
          :src="userProfile?.avatar_path || defaultAvatarUrl"
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
          <span>{{ user?.id }}</span>
        </div>
        <div class="info-item">
          <strong>Email:</strong>
          <span>{{ user?.email }}</span>
        </div>
        <div class="info-item">
          <strong>Nome de Usuário:</strong>
          <span>{{ userProfile?.username }}</span>
        </div>
        <div class="info-item" v-if="userProfile?.country_code">
          <strong>País:</strong>
          <span>{{ userProfile?.country_code }}</span> <!-- Exibir código, idealmente nome do país -->
        </div>
        <div class="info-item" v-if="userProfile?.gender">
          <strong>Sexo:</strong>
          <span>{{ formatGender(userProfile?.gender) }}</span>
        </div>
        <div class="info-item" v-if="userProfile?.birth_date">
          <strong>Data de Nascimento:</strong>
          <span>{{ formatDate(userProfile?.birth_date) }}</span>
        </div>
         <div class="info-item">
          <strong>Membro desde:</strong>
          <span>{{ formatDate(userProfile?.created_at, true) }}</span>
        </div>
      </div>
      <section class="user-biases-section card-style" v-if="user">
        <h2>Meus Vieses Declarados</h2>
        <div v-if="isLoadingBiases">Carregando vieses...</div>
        <ul v-else-if="userBiases.length > 0" class="biases-list">
          <li v-for="bias in userBiases" :key="bias.id">
            <NuxtLink :to="`/g/${bias.group?.country_code}/${bias.group?.slug}`"> <!-- Assumindo que group tem country_code e slug -->
                {{ bias.group?.name || 'Grupo Desconhecido' }}
            </NuxtLink>
            (Influência: {{ bias.influence_points }})
            <button @click="removeBias(bias.id)" class="button-danger-text">× Remover</button>
          </li>
        </ul>
        <p v-else>Você ainda não declarou nenhum viés.</p>

        <div class="declare-bias-form">
          <h3>Declarar Novo Viés</h3>
          <div class="form-group">
            <label for="bias-group-select">Selecione um Grupo de Viés:</label>
            <select v-model="selectedGroupIdToDeclare" id="bias-group-select">
              <option disabled value="">-- Escolha um grupo --</option>
              <option v-for="group in availableBiasGroups" :key="group.id" :value="group.id">
                {{ group.name }} ({{ group.country_code.toUpperCase() }})
              </option>
            </select>
          </div>
          <button @click="declareBias" :disabled="!selectedGroupIdToDeclare || isDeclaringBias" class="button-primary">
            {{ isDeclaringBias ? 'Declarando...' : 'Declarar Viés' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import type { Bias, Group } from '~/types/app';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userProfile = useProfile();
const toast = useToast();
const defaultAvatarUrl = '/images/default-avatar.png';

const userBiases = ref<Array<Bias & { group?: Partial<Group> }>>([]); // Para incluir nome do grupo
const availableBiasGroups = ref<Group[]>([]);
const selectedGroupIdToDeclare = ref<string>('');
const isLoadingBiases = ref(false);
const isDeclaringBias = ref(false);

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

async function fetchUserBiases() {
  if (!user.value) return;
  isLoadingBiases.value = true;
  try {
    const { data, error } = await supabase
      .from('biases')
      .select(`
        id,
        influence_points,
        created_at,
        group:groups (id, name, slug, country_code)
      `)
      .eq('user_id', user.value.id);
    if (error) throw error;
    userBiases.value = data || [];
  } catch (e: any) { toast.error("Erro ao buscar seus vieses: " + e.message); }
  finally { isLoadingBiases.value = false; }
}

async function fetchAvailableBiasGroups() {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, country_code, slug')
      .eq('is_open', false)
      .order('name');
    if (error) throw error;
    // Filtrar grupos que o usuário já declarou
    const declaredGroupIds = userBiases.value.map(b => b.group?.id);
    availableBiasGroups.value = (data || []).filter((g: Group) => !declaredGroupIds.includes(g.id));
  } catch (e: any) { toast.error("Erro ao buscar grupos disponíveis: " + e.message); }
}

async function declareBias() {
  if (!user.value || !selectedGroupIdToDeclare.value) return;
  isDeclaringBias.value = true;
  try {
    const { data, error } = await supabase
      .from('biases')
      .insert({
        user_id: user.value.id,
        group_id: selectedGroupIdToDeclare.value
      })
      .select()
      .single();
    if (error) throw error;
    if (data) {
      toast.success('Viés declarado com sucesso!');
      fetchUserBiases(); // Re-busca para atualizar a lista
      fetchAvailableBiasGroups(); // Re-busca para atualizar o select
      selectedGroupIdToDeclare.value = '';
    }
  } catch (e: any) {
    if (e.message?.includes('unique constraint')) {
        toast.error('Você já declarou este viés.');
    } else {
        toast.error("Erro ao declarar viés: " + e.message);
    }
  } finally {
    isDeclaringBias.value = false;
  }
}

async function removeBias(biasId: string) {
  if (!confirm("Tem certeza que deseja remover este viés? Você perderá sua influência acumulada.")) return;
  try {
    const { error } = await supabase.from('biases').delete().eq('id', biasId);
    if (error) throw error;
    toast.success("Viés removido.");
    fetchUserBiases();
    fetchAvailableBiasGroups();
  } catch (e:any) {
    toast.error("Erro ao remover viés: " + e.message);
  }
}

onMounted(async () => {
  if (user.value) {
    await fetchUserBiases();
    await fetchAvailableBiasGroups();
  }
});
watch(user, async (currentUser) => {
  if(currentUser) {
    await fetchUserBiases();
    await fetchAvailableBiasGroups();
  } else {
    userBiases.value = [];
    availableBiasGroups.value = [];
  }
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

.loading-spinner {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.user-biases-section { margin-top: 2rem; }
.user-biases-section h2 { margin-bottom: 1rem; }
.biases-list { list-style: none; padding-left: 0; }
.biases-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}
.biases-list li:last-child { border-bottom: none; }
.button-danger-text {
    background: none; border: none; color: #dc3545; cursor: pointer; padding: 0.3rem;
    font-size: 0.85rem;
}
.button-danger-text:hover { text-decoration: underline; }

.declare-bias-form { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed var(--border-color); }
.declare-bias-form h3 { margin-bottom: 1rem; font-size: 1.2rem; }
.declare-bias-form .form-group { margin-bottom: 1rem; }
.declare-bias-form select {
  width: 100%; max-width: 400px; padding: 0.7rem;
  border: 1px solid var(--border-color); border-radius: 4px;
  font-size: 1rem; background-color: #fff;
}
</style>
