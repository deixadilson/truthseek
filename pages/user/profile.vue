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
      <section class="user-biases-section card-style" v-if="user">
        <h2>Meus Vieses Declarados</h2>
        <div v-if="isLoadingBiases">Carregando vieses...</div>
        <ul v-else-if="userBiases.length > 0" class="biases-list">
          <li v-for="bias in userBiases" :key="bias.id">
            <NuxtLink :to="`/${bias.group?.country_code}/${bias.group?.slug}`">
                {{ bias.group?.name || 'Grupo Desconhecido' }}
            </NuxtLink>
            Influência: {{ bias.influence_points }}
            <button @click="removeBias(bias.id)" class="button-danger-text">× Remover</button>
          </li>
        </ul>
        <p v-else>Você ainda não declarou nenhum viés.</p>
        <div class="declare-bias-action">
          <NuxtLink to="/categories" class="button-primary">
            Declarar Novo Viés / Explorar Grupos
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import type { Profile, Bias, Group } from '~/types/app';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userProfile = useProfile();
const toast = useToast();
const defaultAvatarUrl = '/images/default-avatar.png';

const avatarFileInputRef = ref<HTMLInputElement | null>(null);
const currentAvatarDisplay = ref<string>(defaultAvatarUrl);
const isUploadingAvatar = ref(false);
let currentSelectedFileForUpload: File | null = null;
let avatarBucketPath = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

const userBiases = ref<Array<Bias & { group?: Partial<Group> }>>([]);
const isLoadingBiases = ref(false);

function formatGender(genderCode: string | null | undefined): string {
  if (genderCode === 'm') return 'Masculino';
  if (genderCode === 'f') return 'Feminino';
  return 'Não informado';
}

function formatDate(dateString: string | null | undefined, includeTime: boolean = false): string {
  if (!dateString) return 'Não informada';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
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
        .update({ avatar_path: actualPathInBucket, updated_at: new Date().toISOString() }) // Salvar o path relativo ao bucket
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

.declare-bias-action {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border-color);
  text-align: center;
}
</style>
