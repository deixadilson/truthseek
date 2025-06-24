<template>
  <div class="profile-page container">
    <div v-if="!userProfile" class="loading-spinner">Carregando perfil...</div>
    <div v-else class="profile-card">
      <h2>Seu Perfil</h2>
      <div class="avatar-section">
        <img
          :src="currentAvatarDisplay"
          alt="Avatar do usuário"
          class="profile-avatar"
          @error="onAvatarError"
        />
        <input
          type="file"
          ref="avatarFileInputRef"
          @change="handleFileSelect"
          accept="image/png, image/jpeg"
          style="display: none"
        />
        <button
          @click="triggerFileInput"
          class="button-secondary upload-button"
          :disabled="isUploadingAvatar"
        >
          {{ isUploadingAvatar ? 'Enviando...' : 'Alterar Avatar' }}
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
          <span>Brasil</span>
        </div>
        <div class="info-item" v-if="userProfile?.gender">
          <strong>Sexo:</strong>
          <span>{{ formatGender(userProfile?.gender) }}</span>
        </div>
        <div class="info-item" v-if="userProfile?.birth_date">
          <strong>Nascimento:</strong>
          <span>{{ formatDate(userProfile?.birth_date) }}</span>
        </div>
         <div class="info-item">
          <strong>Membro desde:</strong>
          <span>{{ formatDate(userProfile?.created_at, true) }}</span>
        </div>
      </div>
      <section class="user-biases-section" v-if="user">
        <h2>Meus Vieses Declarados</h2>
        <div v-if="isLoadingBiases" class="loading-spinner">Carregando vieses...</div>
        <div v-else-if="groupedBiases.length > 0">
          <div
            v-for="category in groupedBiases"
            :key="category.categoryName"
            class="bias-category-group"
          >
            <header class="category-header">
              <span class="category-name">{{ category.categoryName }}</span>
              <span class="influence-header">Influência</span>
            </header>
            <ul class="biases-list">
              <li v-for="bias in category.biases" :key="`${bias.id}`" class="bias-item">
                <NuxtLink :to="`/${bias.group_country_code}/${bias.group_slug}`" class="bias-link">
                  <div class="bias-flag-container">
                    <img
                      v-if="bias.group_flag_path"
                      :src="`https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${bias.group_flag_path}`"
                      :alt="`Bandeira de ${bias.group_name}`"
                      class="bias-flag"
                    />
                    <div class="bias-flag-placeholder">
                      <span>{{ bias.group_name?.substring(0, 1) || '?' }}</span>
                    </div>
                  </div>
                  <span class="bias-name">{{ bias.group_name || 'Grupo Desconhecido' }}</span>
                </NuxtLink>
                <div class="bias-influence">
                  <span class="points">{{ bias.influence_points }}</span>
                  <span class="title">Aspirante</span>
                </div>
                <button  v-if="bias.id" @click="removeBias(bias.id)" class="remove-bias-btn" title="Remover Viés">
                  ×
                </button>
              </li>
            </ul>
          </div>
        </div>
        <p v-else class="no-biases-message">Você ainda não declarou nenhum viés.</p>
        <div class="declare-bias-action">
          <NuxtLink to="/categories" class="button-primary">
            Declarar Novo Viés / Explorar&nbsp;Grupos
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import type { Profile, BiasWithDetails } from '~/types/app';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userProfile = useProfile();
const toast = useToast();
const defaultAvatarUrl = '/images/default-avatar.png';

const avatarFileInputRef = ref<HTMLInputElement | null>(null);
const currentAvatarDisplay = ref<string>(defaultAvatarUrl);
const isUploadingAvatar = ref(false);
const avatarBucketPath = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';
let currentSelectedFileForUpload: File | null = null;

const userBiases = ref<BiasWithDetails[]>([]);
const isLoadingBiases = ref(false);

const groupedBiases = computed(() => {
  const groups: Record<string, { categoryName: string; biases: BiasWithDetails[] }> = {};
  if (!userBiases.value) return [];

  userBiases.value.forEach(bias => {
    const categoryId = bias.category_id || 'other';
    const categoryName = bias.category_name || 'Outros Vieses';

    if (!groups[categoryId]) {
      groups[categoryId] = {
        categoryName: categoryName,
        biases: []
      };
    }
    groups[categoryId].biases.push(bias);
  });

  return Object.values(groups);
});

async function fetchUserBiases() {
  if (!user.value) return;
  isLoadingBiases.value = true;
  try {
    const { data, error } = await supabase
      .from('biases_with_details')
      .select('*')
      .eq('user_id', user.value.id);

    if (error) throw error;
    userBiases.value = data || [];
  } catch (e: any) {
    toast.error("Erro ao buscar seus vieses: " + e.message);
  } finally {
    isLoadingBiases.value = false;
  }
}

function triggerFileInput() {
  avatarFileInputRef.value?.click();
}

function onAvatarError() {
  if (currentAvatarDisplay.value !== defaultAvatarUrl) {
    console.warn("Erro ao carregar avatar, usando padrão.");
    currentAvatarDisplay.value = defaultAvatarUrl;
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (avatarFileInputRef.value) avatarFileInputRef.value.value = '';

  if (file) {
    if (file.size > 512 * 1024) {
      currentSelectedFileForUpload = null;
      toast.error('O arquivo é muito grande (máx 512KB).');
      return;
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use PNG ou JPG.');
      return;
    }

    const oldPreview = currentAvatarDisplay.value; // Salva o preview atual caso o upload falhe
    if (oldPreview.startsWith('blob:')) URL.revokeObjectURL(oldPreview); // Revoga URL de objeto antiga para evitar memory leaks
    currentAvatarDisplay.value = URL.createObjectURL(file); // Mostrar preview localmente

    await uploadAvatar(file);
  }
}

async function uploadAvatar(fileToUpload: File) {
  if (!user.value || !userProfile.value) {
    toast.error('Sessão de usuário inválida para upload.');
    return;
  }

  isUploadingAvatar.value = true;

  try {
    const fileExt = fileToUpload.name.split('.').pop()?.toLowerCase();
    const filePath = `${user.value.id}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    if (uploadData?.path) {
      const newAvatarPath = uploadData.path;
      const actualPathInBucket = newAvatarPath.startsWith(user.value.id) ? newAvatarPath : newAvatarPath.split('/').slice(1).join('/');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_path: actualPathInBucket, updated_at: new Date().toISOString() } as never)
        .eq('id', user.value.id);

      if (updateError) throw updateError;

      // Atualizar o estado global userProfile
      userProfile.value = { ...userProfile.value, avatar_path: actualPathInBucket, updated_at: new Date().toISOString() } as Profile;
      
      const newStoredAvatarUrl = `${avatarBucketPath}/${actualPathInBucket}?t=${new Date().getTime()}`;
      if (currentAvatarDisplay.value.startsWith('blob:')) URL.revokeObjectURL(currentAvatarDisplay.value);
      currentAvatarDisplay.value = newStoredAvatarUrl;

      toast.success('Avatar atualizado com sucesso!');
    } else {
      throw new Error("Falha no upload, dados de upload não retornados.");
    }
  } catch (e: any) {
    console.error('Erro no upload do avatar:', e);
    toast.error(e.message || 'Falha ao enviar o avatar.');
    // Reverter para o avatar anterior do estado userProfile
    if (currentAvatarDisplay.value.startsWith('blob:')) {
      URL.revokeObjectURL(currentAvatarDisplay.value);
    }
    currentAvatarDisplay.value = userProfile.value?.avatar_path
      ? `${avatarBucketPath}/${userProfile.value.avatar_path}`
      : defaultAvatarUrl;
  } finally {
    isUploadingAvatar.value = false;
  }
}

async function removeBias(biasId: string) {
  if (!confirm("Tem certeza que deseja remover este viés? Você perderá sua influência acumulada.")) return;
  try {
    const { error } = await supabase.from('biases').delete().eq('id', biasId);
    if (error) throw error;
    toast.success("Viés removido.");
    fetchUserBiases();
  } catch (e:any) {
    toast.error("Erro ao remover viés: " + e.message);
  }
}

onMounted(async () => {
  if (user.value) {
    await fetchUserBiases();
  }
});
watch(userProfile, (newProfileData) => {
  if (newProfileData) {
    currentAvatarDisplay.value = newProfileData.avatar_path
      ? `${avatarBucketPath}/${newProfileData.avatar_path}`
      : defaultAvatarUrl;
  } else {
    currentAvatarDisplay.value = defaultAvatarUrl;
  }
}, { immediate: true, deep: true });
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
  gap: 0.75rem;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-color);
  background-color: #f0f0f0;
  margin-bottom: 0.5rem;
}

.upload-button {
  font-size: 0.9em;
}

.profile-info {
  display: grid;
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

.user-biases-section {
  margin-top: 2rem;
}
.user-biases-section h2 {
  margin-bottom: 1rem;
}

.bias-category-group {
  margin-bottom: 1.5rem;
}
.bias-category-group:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: var(--primary-color-light);
  color: var(--primary-color-dark);
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: 4px 4px 0 0;
  border-bottom: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
}
.influence-header {
  min-width: 120px;
}

.biases-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 4px 4px;
}

.bias-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}
.biases-list li:last-child {
  border-bottom: none;
}

.bias-link {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-color);
}
.bias-link:hover .bias-name {
  color: var(--primary-color);
}

.bias-flag-container {
  flex-shrink: 0;
}
.bias-flag {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}
.bias-flag-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #888;
}

.bias-name {
  font-weight: 500;
  transition: color 0.2s;
}

.bias-influence {
  flex-shrink: 0;
  min-width: 120px;
  text-align: right;
  font-size: 0.9rem;
}
.bias-influence .points {
  font-weight: bold;
  color: var(--primary-color);
  margin-right: 0.5rem;
}
.bias-influence .title {
  color: #666;
}

.remove-bias-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}
.remove-bias-btn:hover {
  color: #dc3545;
}

.declare-bias-action {
  margin-top: 1.5rem;
  text-align: center;
}
.no-biases-message {
    padding: 1.5rem;
    text-align: center;
    color: #777;
    font-style: italic;
    background-color: #f9f9f9;
    border: 1px dashed var(--border-color);
    border-radius: 4px;
}

@media (max-width: 600px) {
  .influence-header,
  .bias-influence {
    display: none;
  }
}
</style>
