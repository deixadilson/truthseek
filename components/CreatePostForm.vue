<template>
  <div class="create-post-form card-style">
    <h3>Criar Nova Postagem</h3>
    <form @submit.prevent="submitPost">
      <div class="form-group">
        <textarea
          ref="textareaRef"
          v-model="textContent"
          placeholder="O que você tem em mente? Cole um link de vídeo do YouTube/Vimeo ou uma imagem aqui, ou arraste uma imagem."
          rows="4"
          @paste="handlePaste"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': isDraggingOver }"
        ></textarea>
      </div>

      <div v-if="imagePreviewUrl || embedVideoUrl" class="media-preview-container form-group">
        <!-- ... (preview de mídia como antes) ... -->
        <div v-if="imagePreviewUrl" class="image-preview">
          <img :src="imagePreviewUrl" alt="Pré-visualização da imagem" />
          <button type="button" @click="removeImage" class="remove-media-btn">×</button>
        </div>
        <div v-if="embedVideoUrl" class="video-preview">
          <iframe
            :src="embedVideoUrl"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
          <button type="button" @click="removeVideo" class="remove-media-btn">×</button>
        </div>
      </div>

      <!-- Container para ações do formulário (upload, opções, botão de postar) -->
      <div class="form-actions-toolbar">
        <div class="media-and-options">
          <label for="hidden-file-input" class="button-like-label button-secondary add-image-btn" title="Adicionar Imagem">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
              <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
            </svg>
            <span class="btn-text">Imagem</span> <!-- Texto opcional para telas maiores -->
          </label>
          <input
            type="file" id="hidden-file-input" @change="handleImageFileSelected"
            accept="image/*" style="display: none" ref="fileInputRef"
          />

          <div class="post-options">
            <label title="Postar anonimamente">
              <input type="checkbox" v-model="isAnonymous" />
              <span class="checkbox-label">Anônimo</span>
            </label>
            <label title="Conteúdo requer moderação / Respostas moderadas">
              <input type="checkbox" v-model="isModeratedContent" />
              <span class="checkbox-label">Moderado</span>
            </label>
          </div>
        </div>

        <button type="submit" class="button-primary submit-post-btn" :disabled="isLoading || !canSubmit">
          {{ isLoading ? 'Postando...' : 'Postar' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  ownerId: string;
  ownerType: 'group' | 'vs_group' | 'user_timeline';
}>();

const emit = defineEmits(['post-created']);

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const toast = useToast();

const textContent = ref('');
const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const videoUrlToSave = ref<string | null>(null);
const embedVideoUrl = ref<string | null>(null);
const isAnonymous = ref(false);
const isModeratedContent = ref(false);
const isLoading = ref(false);
const isDraggingOver = ref(false);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const canSubmit = computed(() => {
  return textContent.value.trim() !== '' || imageFile.value !== null || videoUrlToSave.value !== null;
});

// --- Funções de Mídia ---
function isValidImageUrl(url: string): boolean {
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
}
function isValidVideoUrl(url: string): string | null {
  let videoId;
  // YouTube: youtube.com/watch?v=VIDEO_ID ou youtu.be/VIDEO_ID
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]+)/;
  // Vimeo: vimeo.com/VIDEO_ID
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/.+\/|groups\/.+\/videos\/|album\/.+\/video\/|video\/)?(\d+)/;

  let match = url.match(youtubeRegex);
  if (match && match[1]) {
    videoId = match[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  match = url.match(vimeoRegex);
  if (match && match[1]) {
    videoId = match[1];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return null;
}

function processPastedOrDroppedData(data: string | File) {
  if (typeof data === 'string') { // Colou texto
    const potentialVideoEmbedUrl = isValidVideoUrl(data);
    if (potentialVideoEmbedUrl) {
      if (imageFile.value) {
        toast.warning('Remova a imagem antes de adicionar um vídeo.');
        return;
      }
      embedVideoUrl.value = potentialVideoEmbedUrl;
      videoUrlToSave.value = data; // Salva a URL original
      textContent.value = textContent.value.replace(data, '').trim(); // Remove o link do textarea
    } else if (isValidImageUrl(data)) {
      // Tentar carregar imagem de URL colada (requer CORS e pode não funcionar sempre)
      // Por simplicidade, podemos apenas pedir para usar o botão de upload ou drag-n-drop para URLs de imagem
      // Ou implementar fetch + blob para tentar baixar a imagem
      toast.info('Para adicionar uma imagem de um link, use o botão "Adicionar Imagem" ou arraste e solte o arquivo.');
    }
  } else { // Arrastou/selecionou arquivo de imagem
    if (videoUrlToSave.value) {
      toast.warning('Remova o vídeo antes de adicionar uma imagem.');
      return;
    }
    imageFile.value = data;
    imagePreviewUrl.value = URL.createObjectURL(data);
  }
}

function handlePaste(event: ClipboardEvent) {
  const pastedData = event.clipboardData?.getData('text');
  if (pastedData) {
    // Dá um pequeno tempo para o Vue atualizar o v-model do textarea
    // antes de processarmos, caso o link do vídeo seja parte do texto colado.
    setTimeout(() => {
      processPastedOrDroppedData(pastedData);
    }, 0);
  }
  // Lógica para colar arquivos de imagem (mais complexa, pode precisar de acesso a `event.clipboardData.files`)
  const items = event.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          if (videoUrlToSave.value) {
            toast.warning('Remova o vídeo antes de colar uma imagem.');
            return;
          }
          imageFile.value = blob;
          imagePreviewUrl.value = URL.createObjectURL(blob);
          event.preventDefault(); // Impedir que a imagem seja colada como base64 no textarea
          break;
        }
      }
    }
  }
}

function handleImageFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    processPastedOrDroppedData(target.files[0]);
  }
}

function handleDragOver() { isDraggingOver.value = true; }
function handleDragLeave() { isDraggingOver.value = false; }
function handleDrop(event: DragEvent) {
  isDraggingOver.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    if (event.dataTransfer.files[0].type.startsWith('image/')) {
      processPastedOrDroppedData(event.dataTransfer.files[0]);
    } else {
      toast.error('Apenas arquivos de imagem podem ser arrastados.');
    }
  }
}

function removeImage() {
  imageFile.value = null;
  imagePreviewUrl.value = null;
  if (fileInputRef.value) fileInputRef.value.value = ''; // Limpar o input de arquivo
}
function removeVideo() {
  embedVideoUrl.value = null;
  videoUrlToSave.value = null;
}

function resetForm() {
  textContent.value = '';
  removeImage();
  removeVideo();
  isAnonymous.value = false;
  isModeratedContent.value = false;
}

async function submitPost() {
  if (!user.value) {
    toast.error('Você precisa estar logado para postar.');
    return;
  }
  if (!canSubmit.value) {
    toast.warning('O post precisa de conteúdo (texto, imagem ou vídeo).');
    return;
  }
  if (imageFile.value && videoUrlToSave.value) { // Dupla checagem
    toast.error('Você não pode enviar uma imagem e um vídeo ao mesmo tempo.');
    return;
  }

  isLoading.value = true;
  let imagePathToSave: string | null = null;

  try {
    if (imageFile.value) {
      const file = imageFile.value;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${user.value.id}_${Date.now()}.${fileExt}`;
      const filePath = `public/${props.ownerType}/${props.ownerId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, file, { upsert: false }); // upsert: false para evitar sobrescrever

      if (uploadError) throw uploadError;
      if (uploadData) imagePathToSave = uploadData.path;
    }

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: user.value.id,
        owner_id: props.ownerId,
        owner_type: props.ownerType,
        text_content: textContent.value.trim() || null,
        image_path: imagePathToSave,
        video_url: videoUrlToSave.value, // Salva a URL original, não a de embed
        is_anonymous: isAnonymous.value,
        is_moderated_content: isModeratedContent.value,
      })
      .select()
      .single();

    if (postError) throw postError;

    if (postData) {
      toast.success('Post criado com sucesso!');
      emit('post-created', postData);
      resetForm();
    }
  } catch (e: any) {
    console.error('Erro ao criar post:', e);
    toast.error(e.message || 'Falha ao criar post.');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.create-post-component { margin-bottom: 1rem; }
.create-post-form h3 { margin-top: 0; margin-bottom: 1rem; color: var(--primary-color); }
.form-group { margin-bottom: 1rem; }
textarea {
  width: 100%; min-height: 100px; padding: 0.75rem;
  border: 1px solid var(--border-color); border-radius: 4px;
  font-family: inherit; font-size: 1rem; line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
}
textarea:focus {
  outline: none; border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}
textarea.drag-over {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 30%, transparent),
              inset 0 0 10px color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.media-preview-container {
  border: 1px dashed var(--border-color);
  padding: 1rem;
  border-radius: 4px;
  position: relative; /* Para o botão de remover */
}
.image-preview img { max-width: 100%; max-height: 300px; display: block; margin: 0 auto; border-radius: 4px; }
.video-preview iframe { width: 100%; aspect-ratio: 16 / 9; border-radius: 4px; }
.remove-media-btn {
  position: absolute; top: 5px; right: 5px;
  background-color: rgba(0,0,0,0.6); color: white;
  border: none; border-radius: 50%;
  width: 24px; height: 24px;
  font-size: 16px; line-height: 22px; text-align: center;
  cursor: pointer; padding: 0;
  transition: background-color 0.2s;
}
.remove-media-btn:hover { background-color: rgba(0,0,0,0.8); }
.form-actions-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
}
.media-and-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.media-actions { margin-top: 0.5rem; }
.button-like-label.add-image-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5em 0.8em;
  cursor: pointer;
}
.button-like-label.add-image-btn .btn-text {
  margin-left: 0.4em;
}
.post-options {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}
.post-options label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  white-space: nowrap;
}
.form-actions { display: flex; justify-content: flex-end; margin-top: 1rem; }

@media (max-width: 500px) {
  .form-actions-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .media-and-options {
    justify-content: space-around;
    margin-bottom: 1rem;
  }
  .submit-post-btn {
    align-self: flex-end;
  }
}

/* Opcional: Esconder texto dos botões de ação em telas muito pequenas, mostrando só ícones
@media (max-width: 480px) {
  .button-like-label.add-image-btn .btn-text,
  .post-options .checkbox-label {
    /* display: none; /* Descomente para esconder texto e mostrar só ícone/checkbox
  }
   .media-and-options {
    gap: 0.5rem; /* Menor espaço em telas muito pequenas
    justify-content: space-between;
  }
  .post-options {
    gap: 0.75rem;
  }
}
 */
</style>
