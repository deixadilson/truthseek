<template>
  <div class="single-post-page container">
    <div v-if="isLoadingPost" class="loading-spinner">
      <LoadingMessage message="Carregando post..." />
    </div>
    <div v-else-if="postError" class="error-message">
      {{ postError }}
      <p><NuxtLink :to="goBackLink" class="button-secondary">Voltar</NuxtLink></p>
    </div>
    <div v-else-if="post" class="post-and-comments">
      <PostItem :post="post" class="main-post-item" />

      <section class="comments-section card-style">
        <h3>Comentários ({{ comments.length }})</h3>
        <CreateCommentForm
          v-if="user && post && post.id"
          :post-id="post.id"
          @comment-created="addNewCommentToList"
          class="main-comment-form"
        />
        <div v-else-if="post && !user" class="guest-comment-prompt">
          <p>
            <NuxtLink to="/user/register">Crie uma conta</NuxtLink>
            ou
            <NuxtLink to="/user/login">faça login</NuxtLink>
            para comentar.
          </p>
        </div>

        <!-- Lista de Comentários -->
        <div v-if="isLoadingComments" class="loading-spinner">
          <LoadingMessage message="Carregando comentários..." />
        </div>
        <div v-else-if="commentsError" class="error-message">{{ commentsError }}</div>
        <div v-else-if="comments.length > 0" class="comments-list">
          <CommentItem
            v-for="comment in comments"
            :key="`${comment.id}`"
            :comment="comment"
            :post-owner-group-id="post.owner_id"
            :replied-to-username="comment.reply_to ? getRepliedToUsernameForChild(comment.reply_to) : null"
            :is-highlighted="highlightedCommentId === comment.id"
            @request-reply="handleRequestReply"
            @scroll-to-comment="scrollToComment"
            @vote-updated="handleCommentVoteUpdated"
          />
        </div>
        <div v-else class="no-comments">
          <p>Nenhum comentário ainda. Seja o primeiro!</p>
        </div>
        <!-- Input para responder a um comentário específico -->
        <CreateCommentForm
          v-if="user && post && post.id && replyingToCommentId"
          :key="`reply-form-${replyingToCommentId}`"
          :post-id="post.id"
          :reply-to-comment-id="replyingToCommentId"
          :reply-to-username="replyingToUsername"
          @comment-created="handleNewComment"
          @reply-cancelled="cancelReply"
          class="reply-comment-form"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase';
import type { PostWithAuthor, CommentWithAuthor} from '~/types/app';
import { useToast } from 'vue-toastification';
import { MIN_INFLUENCE_TO_ENTER_GROUP } from '~/utils/formatters';

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const authUserId = useAuthUserId();
const toast = useToast();

const postId = route.params.id as string;
const post = ref<PostWithAuthor | null>(null);
const comments = ref<CommentWithAuthor[]>([]);

const isLoadingPost = ref(true);
const postError = ref<string | null>(null);
const isLoadingComments = ref(false);
const commentsError = ref<string | null>(null);

const replyingToCommentId = ref<string | null>(null);
const highlightedCommentId = ref<string | null>(null);
const replyingToUsername = ref<string | null>(null);

const goBackLink = computed(() => {
  return '/categories';
});

/** Guests and low-influence users may only open posts from open groups. */
async function canViewPost(postData: PostWithAuthor): Promise<boolean> {
  if (postData.owner_type !== 'group' || !postData.owner_id) {
    return !!authUserId.value;
  }

  const { data: group, error } = await supabase
    .from('groups')
    .select('id, is_open')
    .eq('id', postData.owner_id)
    .single();

  if (error || !group) return false;
  if (group.is_open) return true;

  // Closed group: require influence threshold
  if (!authUserId.value) return false;

  const { data: bias } = await supabase
    .from('biases')
    .select('influence_points')
    .eq('user_id', authUserId.value)
    .eq('group_id', group.id)
    .maybeSingle();

  return (bias?.influence_points ?? 0) >= MIN_INFLUENCE_TO_ENTER_GROUP;
}

async function fetchPostDetails() {
  isLoadingPost.value = true; postError.value = null;
  try {
    const { data, error } = await supabase
      .from('posts_with_author_info')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Post não encontrado.');
      throw error;
    }
    if (data) {
      const postData = data as PostWithAuthor;
      const allowed = await canViewPost(postData);
      if (!allowed) {
        post.value = null;
        postError.value = authUserId.value
          ? 'Você não tem influência suficiente para ver este post de grupo fechado.'
          : 'Este post pertence a um grupo fechado. Crie uma conta e declare o viés para acessá-lo.';
        return;
      }
      post.value = postData;
      await fetchComments();
    } else {
      postError.value = 'Post não encontrado.';
    }
  } catch (e: any) {
    console.error("Erro ao buscar post:", e);
    postError.value = e.message || 'Falha ao carregar o post.';
    toast.error(postError.value);
  } finally {
    isLoadingPost.value = false;
  }
}

async function fetchComments() {
  if (!post.value || !post.value.id) return;
  isLoadingComments.value = true; commentsError.value = null;
  try {
    const { data, error } = await supabase
      .from('comments_with_author_info')
      .select('*')
      .eq('post_id', post.value.id)
      .order('created_at', { ascending: true }); // Comentários mais antigos primeiro

    if (error) throw error;
    comments.value = data as CommentWithAuthor[] || [];
  } catch (e: any) {
    console.error("Erro ao buscar comentários:", e);
    commentsError.value = e.message || 'Falha ao carregar comentários.';
    toast.error(commentsError.value);
  } finally {
    isLoadingComments.value = false;
  }
}

function handleNewComment(newComment: CommentWithAuthor) {
  comments.value.push(newComment);
  nextTick(() => {
    scrollToComment(newComment.id);
  });
}

function handleRequestReply(payload: { commentId: string; username: string | null }) {
  replyingToCommentId.value = payload.commentId;
  replyingToUsername.value = payload.username;
  const replyFormEl = document.querySelector('.reply-comment-form');
  if (replyFormEl) replyFormEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Para passar o username correto para o CommentItem quando ele é uma resposta
function getRepliedToUsernameForChild(commentId: string): string | null {
  const repliedComment = comments.value.find(c => c.id === commentId);
  return repliedComment?.is_anonymous ? 'Anônimo' : (repliedComment?.author_username || null);
}

function addNewCommentToList(newComment: CommentWithAuthor) {
  comments.value.push(newComment);
}

function cancelReply() {
  replyingToCommentId.value = null;
  replyingToUsername.value = null;
}

function scrollToComment(commentId: string | null, blockPosition: ScrollLogicalPosition = 'center') {
  if (!commentId) return;
  highlightedCommentId.value = commentId;
  const element = document.getElementById(`comment-${commentId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: blockPosition });
    setTimeout(() => {
      if (highlightedCommentId.value === commentId) {
        highlightedCommentId.value = null;
      }
    }, 2000);
  }
}

function handleCommentVoteUpdated(payload: { commentId: string, likes: number, dislikes: number, userVote: number | null }) {
  const commentIndex = comments.value.findIndex(c => c.id === payload.commentId);
  if (commentIndex !== -1) {
    comments.value[commentIndex].likes_count = payload.likes;
    comments.value[commentIndex].dislikes_count = payload.dislikes;
  }
}

useHead({
  title: 'Post - TruthSeek Network'
});

onMounted(() => {
  if (postId) {
    fetchPostDetails();
  } else {
    postError.value = "ID do post não encontrado na URL.";
    isLoadingPost.value = false;
  }
});
</script>

<style scoped>
.single-post-page { padding-top: 2rem; padding-bottom: 3rem; }
.main-post-item { margin-bottom: 2rem; }
.comments-section h3 { margin-top: 0; margin-bottom: 1.5rem; color: var(--primary-color); }

.comments-list { margin-top: 1.5rem; }

.no-comments { text-align: center; padding: 1.5rem; color: #777; font-style: italic; }
.guest-comment-prompt {
  text-align: center;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f7f7f7;
  border-radius: 6px;
  color: #555;
}
.guest-comment-prompt a { color: var(--primary-color); font-weight: 500; }
.loading-spinner {
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}
.error-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}
.error-message { color: #dc3545; }
</style>