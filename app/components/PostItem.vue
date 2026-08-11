<template>
  <article class="post-item card-style">
    <header class="post-header">
      <AuthorPopover
        :author-id="post.author_id"
        :context-group-id="post.owner_id"
        :hide-trigger-arrow="true"
        v-if="post.author_id && post.owner_id && !post.is_anonymous"
      >
        <div class="author-info">
          <img :src="authorAvatarUrl" alt="Avatar do autor" class="author-avatar"/>
          <div>
            <span class="author-name">{{ post.author_username || (post.is_anonymous ? 'Anônimo' : 'Usuário Desconhecido') }}</span>
            <span v-if="post.created_at" class="post-timestamp">
              {{ timeAgo(post.created_at) }} <span v-if="post.is_edited">(editado)</span>
            </span>
            <span v-else class="post-timestamp">
              Data indisponível
            </span>
          </div>
        </div>
      </AuthorPopover>
      <div v-else class="author-info">
         <img :src="authorAvatarUrl" alt="Avatar" class="author-avatar"/>
          <div>
            <span class="author-name">{{ post.is_anonymous ? 'Anônimo' : (post.author_username || 'Usuário Desconhecido') }}</span>
            <span v-if="post.created_at" class="post-timestamp">{{ timeAgo(post.created_at) }} <span v-if="post.is_edited">(editado)</span></span>
          </div>
      </div>
      <div class="post-options-dropdown">
        <!-- Placeholder para menu de opções (editar, deletar, denunciar) -->
        <button title="Opções do post" class="options-btn">⋮</button>
      </div>
    </header>

    <div class="post-content">
      <p v-if="post.text_content" class="text-content" v-html="formattedTextContent"></p>
      <div v-if="post.image_path" class="image-content">
        <img :src="postImageUrl" :alt="`Imagem do post de ${post.author_username || 'usuário'}`" />
      </div>
      <div v-if="post.video_url" class="video-content">
        <iframe
          :src="embedVideoUrl || undefined"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <footer class="post-footer">
      <div class="actions">
        <button class="action-btn like-btn" @click="handleVote(1)" :class="{ 'active': currentUserVote === 1 }">
          <Icon name="lucide:thumbs-up" :size="18" />
          <span>{{ localLikesCount }}</span>
        </button>
        <button class="action-btn dislike-btn" @click="handleVote(-1)" :class="{ 'active': currentUserVote === -1 }">
          <Icon name="lucide:thumbs-down" :size="18" />
          <span>{{ localDislikesCount }}</span>
        </button>
        <NuxtLink :to="`/post/${post.id}`" class="action-btn comment-btn">
          <Icon name="lucide:message-square" :size="18" />
          <span>{{ post.comments_count || 0 }}</span>
        </NuxtLink>
      </div>
      <div class="share-action">
        <!-- Placeholder para compartilhar -->
        <button class="action-btn share-btn" title="Compartilhar">
          <Icon name="lucide:share-2" :size="18" />
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { PostWithAuthor } from '~/types/app';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  post: PostWithAuthor;
}>();

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const authUserId = useAuthUserId();
const toast = useToast();

// Estado local para feedback imediato da UI e para saber o voto atual do usuário
const currentUserVote = ref<number | null>(null); // 1 para like, -1 para dislike, null para sem voto
const localLikesCount = ref(props.post.likes_count || 0);
const localDislikesCount = ref(props.post.dislikes_count || 0);

const defaultUserAvatar = '/images/default-avatar.png';

const authorAvatarUrl = computed(() => {
  const path = props.post.author_avatar_path;
  if (path) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars/${path}`;
  }
  return defaultUserAvatar;
});

const postImageUrl = computed(() => {
  if (props.post.image_path) {
    return `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/post-media/${props.post.image_path}`;
  }
  return '';
});

const embedVideoUrl = computed(() => getEmbedVideoUrl(props.post.video_url));
const formattedTextContent = computed(() => formatTextToHtml(props.post.text_content));

// Função para buscar o voto atual do usuário para este post
async function fetchCurrentUserVote() {
  if (!authUserId.value || !props.post.id) {
    currentUserVote.value = null;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('user_id', authUserId.value)
      .eq('target_id', props.post.id)
      .eq('target_type', 'post')
      .maybeSingle();

    if (error) throw error;
    currentUserVote.value = data ? data.vote_type : null;
  } catch (e: any) {
    console.error("Erro ao buscar voto do usuário:", e.message);
    // Não mostra toast aqui para não poluir, mas o usuário não verá seu voto anterior
  }
}

async function handleVote(newVoteType: 1 | -1) {
  if (!authUserId.value || !props.post.id) return;

  const oldVote = currentUserVote.value;

  // Lógica para feedback imediato na UI
  if (oldVote === newVoteType) { // Clicou no mesmo botão (like em algo já "likado") -> remover voto
    currentUserVote.value = null;
    if (newVoteType === 1) localLikesCount.value = Math.max(0, localLikesCount.value - 1);
    else localDislikesCount.value = Math.max(0, localDislikesCount.value - 1);
  } else { // Novo voto ou mudando o voto
    currentUserVote.value = newVoteType;
    if (oldVote === 1) localLikesCount.value = Math.max(0, localLikesCount.value - 1); // Removeu like antigo
    else if (oldVote === -1) localDislikesCount.value = Math.max(0, localDislikesCount.value - 1); // Removeu dislike antigo

    if (newVoteType === 1) localLikesCount.value++;
    else localDislikesCount.value++;
  }

  try {
    if (oldVote === newVoteType) { // Remover voto
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', authUserId.value)
        .eq('target_id', props.post.id)
        .eq('target_type', 'post');
      if (error) throw error;
    } else if (oldVote !== null && oldVote !== newVoteType) { // Mudou o voto (ex: de like para dislike)
      const { error } = await supabase
        .from('votes')
        .update({ vote_type: newVoteType })
        .eq('user_id', authUserId.value)
        .eq('target_id', props.post.id)
        .eq('target_type', 'post');
      if (error) throw error;
    } else { // Novo voto (oldVote era null)
      const { error } = await supabase
        .from('votes')
        .insert({
          user_id: authUserId.value,
          target_id: props.post.id,
          target_type: 'post',
          vote_type: newVoteType,
        });
      if (error) throw error;
    }
    // As contagens no DB serão atualizadas pelo trigger.
    // Para UI ficar 100% sincronizada, poderia re-buscar o post ou as contagens,
    // mas o trigger deve manter o DB correto e o feedback local já atualizou.
  } catch (e: any) {
    console.error('Erro ao registrar like:', e);
    toast.error(e.message || 'Falha ao registrar like.');
    // Reverter a UI para o estado anterior em caso de erro
    currentUserVote.value = oldVote;
    // Recalcular contagens locais com base no oldVote para reverter (mais complexo,
    // ou simplesmente re-buscar os dados do post completo se o erro for crítico)
    // Por simplicidade, o feedback local não é revertido aqui, mas o DB estará correto.
    // Uma solução melhor seria esperar o sucesso do DB antes de atualizar a UI, ou ter um sistema de estado otimista.
  }
}

watchEffect(() => { // Para atualizar contagens locais se o prop mudar
  localLikesCount.value = props.post.likes_count || 0;
  localDislikesCount.value = props.post.dislikes_count || 0;
});

onMounted(() => {
  fetchCurrentUserVote();
});

watch(user, () => { // Re-buscar voto se o usuário logar/deslogar
  fetchCurrentUserVote();
});
</script>

<style scoped>
.post-item {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
}
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #eee;
}
.author-name {
  font-weight: 600;
  color: var(--text-color);
  display: block;
}
.post-timestamp {
  font-size: 0.8rem;
  color: #777;
}

.options-btn {
  background: none; border: none; cursor: pointer; padding: 0.5rem;
  color: #777; font-size: 1.2rem; line-height: 1;
}
.options-btn:hover { color: var(--primary-color); }

.post-content {
  margin-bottom: 1rem;
}
.text-content {
  line-height: 1.6;
  white-space: pre-wrap; /* Preserva quebras de linha e espaços */
  word-wrap: break-word; /* Quebra palavras longas */
  margin-bottom: 0.75rem; /* Espaço se houver mídia abaixo */
}
.text-content :deep(a) { /* Estilizar links dentro do v-html */
  color: var(--primary-color);
  text-decoration: underline;
}

.image-content img {
  max-width: 100%;
  border-radius: 6px;
  margin-top: 0.5rem;
  display: block;
}
.video-content iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.9rem;
}
.actions {
  display: flex;
  gap: 1rem;
}
.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #555;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}
.action-btn:hover {
  background-color: var(--primary-color-light);
  color: var(--primary-color-dark);
  text-decoration: none;
}
.action-btn :deep(svg) {
  stroke: currentColor;
  fill: none;
}
.action-btn.active {
  color: var(--primary-color);
}
.action-btn.active :deep(svg) {
  fill: var(--primary-color);
  stroke: var(--primary-color);
}
.action-btn span {
  font-size: 0.85rem;
}
.share-action .action-btn:hover {
  background-color: transparent; /* Para não ter fundo no hover do share */
  color: var(--primary-color);
}
</style>
