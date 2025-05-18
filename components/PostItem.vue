<template>
  <article class="post-item card-style">
    <header class="post-header">
      <div class="author-info">
        <img
          :src="authorAvatarUrl"
          alt="Avatar do autor"
          class="author-avatar"
        />
        <div>
          <span class="author-name">{{ post.author_username || (post.is_anonymous ? 'Anônimo' : 'Usuário Desconhecido') }}</span>
          <span class="post-timestamp">{{ timeAgo(post.created_at) }} <span v-if="post.is_edited">(editado)</span></span>
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
          :src="embedVideoUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <footer class="post-footer">
      <div class="actions">
        <button class="action-btn like-btn" @click="toggleLike">
          <svg width="18" height="18" viewBox="0 0 24 24" :fill="isLikedByCurrentUser ? 'var(--primary-color)' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          <span>{{ post.likes_count || 0 }}</span>
        </button>
        <button class="action-btn dislike-btn" @click="toggleDislike">
           <svg width="18" height="18" viewBox="0 0 24 24" :fill="isDislikedByCurrentUser ? 'var(--primary-color)' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
          <span>{{ post.dislikes_count || 0 }}</span>
        </button>
        <button class="action-btn comment-btn" @click="toggleComments">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>{{ post.comments_count || 0 }}</span>
        </button>
      </div>
      <div class="share-action">
        <!-- Placeholder para compartilhar -->
        <button class="action-btn share-btn" title="Compartilhar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>
    </footer>
    <!-- Seção de comentários (a ser implementada) -->
    <!-- <div v-if="showCommentsSection" class="comments-section"> ... </div> -->
  </article>
</template>

<script setup lang="ts">
import type { DisplayPost } from '~/types/app';
// Importar uma função para calcular "time ago", ex: date-fns ou uma customizada
// import { formatDistanceToNowStrict } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

const props = defineProps<{
  post: DisplayPost;
}>();

// Placeholder para o estado de like/dislike do usuário atual
const isLikedByCurrentUser = ref(false); // Deveria vir do estado ou ser buscado
const isDislikedByCurrentUser = ref(false);

const defaultUserAvatar = '/images/default-avatar.png'; // Mesmo avatar padrão do perfil

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

// Lógica para transformar URL de vídeo em URL de embed
const embedVideoUrl = computed(() => {
  if (!props.post.video_url) return null;
  // (Reutilizar a função isValidVideoUrl do CreatePostForm.vue, idealmente movendo-a para utils)
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]+)/;
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/.+\/|groups\/.+\/videos\/|album\/.+\/video\/|video\/)?(\d+)/;
  let match = props.post.video_url.match(youtubeRegex);
  if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
  match = props.post.video_url.match(vimeoRegex);
  if (match && match[1]) return `https://player.vimeo.com/video/${match[1]}`;
  return null; // Ou retornar a URL original se não for embeddable conhecido
});

// Formatar texto para exibir quebras de linha e detectar links (simplificado)
const formattedTextContent = computed(() => {
  if (!props.post.text_content) return '';
  // Simplesmente substitui \n por <br> e envolve links com <a>
  // Uma solução mais robusta usaria uma biblioteca de markdown ou um parser de HTML seguro.
  return props.post.text_content
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/\n/g, '<br />')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
});


// Função para calcular "time ago" (placeholder)
function timeAgo(timestamp: string): string {
  // Implementar lógica de "time ago" (ex: "há 5 minutos", "ontem", "2 sem atrás")
  // Usar bibliotecas como date-fns (formatDistanceToNowStrict) é recomendado
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `há ${seconds} seg`;
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours} h`;
  if (days < 7) return `há ${days} d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Placeholders para ações
function toggleLike() { console.log('Toggle Like para post:', props.post.id); isLikedByCurrentUser.value = !isLikedByCurrentUser.value; }
function toggleDislike() { console.log('Toggle Dislike para post:', props.post.id); isDislikedByCurrentUser.value = !isDislikedByCurrentUser.value; }
function toggleComments() { console.log('Toggle Comments para post:', props.post.id); }

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
}
.action-btn svg {
  stroke: currentColor; /* Herda a cor do texto */
}
.action-btn.like-btn[fill*="var(--primary-color)"] svg, /* Quando like está ativo */
.action-btn.dislike-btn[fill*="var(--primary-color)"] svg { /* Quando dislike está ativo */
  fill: var(--primary-color);
}
.action-btn span {
  font-size: 0.85rem;
}
.share-action .action-btn:hover {
  background-color: transparent; /* Para não ter fundo no hover do share */
  color: var(--primary-color);
}
</style>