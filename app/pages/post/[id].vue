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
      <PostItem
        :post="post"
        :show-group-context="true"
        class="main-post-item"
        @deleted="handlePostDeleted"
        @updated="handlePostUpdated"
      />

      <section class="comments-section card-style">
        <h3>Comentários ({{ commentTotalLabel }})</h3>
        <CreateCommentForm
          v-if="user && post && post.id"
          :post-id="post.id"
          :post-is-moderated="!!post.is_moderated"
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

        <div v-if="isLoadingComments && comments.length === 0" class="loading-spinner">
          <LoadingMessage message="Carregando comentários..." />
        </div>
        <div v-else-if="commentsError" class="error-message">{{ commentsError }}</div>
        <div v-else-if="visibleComments.length > 0" class="comments-list">
          <CommentItem
            v-for="comment in visibleComments"
            :key="`${comment.id}`"
            :comment="comment"
            :post-owner-group-id="post.owner_id"
            :post-is-moderated="!!post.is_moderated"
            :replied-to-username="comment.reply_to ? getRepliedToUsernameForChild(comment.reply_to) : null"
            :is-highlighted="highlightedCommentId === comment.id"
            @request-reply="handleRequestReply"
            @scroll-to-comment="scrollToComment"
            @vote-updated="handleCommentVoteUpdated"
            @deleted="handleCommentDeleted"
            @updated="handleCommentUpdated"
          />
          <div v-if="hasMoreComments" class="load-more-wrap">
            <button
              type="button"
              class="button-secondary"
              :disabled="isLoadingMoreComments"
              @click="loadMoreComments"
            >
              <LoadingMessage v-if="isLoadingMoreComments" message="Carregando..." :icon-size="16" />
              <template v-else>Carregar mais</template>
            </button>
          </div>
        </div>
        <div v-else class="no-comments">
          <p>Nenhum comentário ainda. Seja o primeiro!</p>
        </div>
        <!-- Input para responder a um comentário específico -->
        <CreateCommentForm
          v-if="user && post && post.id && replyingToCommentId"
          :key="`reply-form-${replyingToCommentId}`"
          :post-id="post.id"
          :post-is-moderated="!!post.is_moderated"
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
const { isAuthorHidden, blockedIds } = useBlock();

const postId = route.params.id as string;
const post = ref<PostWithAuthor | null>(null);
const comments = ref<CommentWithAuthor[]>([]);

const isLoadingPost = ref(true);
const postError = ref<string | null>(null);
const isLoadingComments = ref(false);
const isLoadingMoreComments = ref(false);
const hasMoreComments = ref(false);
const commentsError = ref<string | null>(null);

const COMMENTS_PAGE_SIZE = 20;

const visibleComments = computed(() =>
  comments.value.filter((comment) => !isAuthorHidden(comment.author_id))
);

const commentTotalLabel = computed(() => {
  const total = post.value?.comments_count;
  if (typeof total === 'number') return total;
  return comments.value.length;
});

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
      let postData = data as PostWithAuthor;

      // Resolve group name/slug directly (do not rely on view cache for these fields)
      if (postData.owner_id) {
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('name, slug, country_code')
          .eq('id', postData.owner_id)
          .maybeSingle();
        if (groupError) {
          console.error('Erro ao buscar grupo do post:', groupError);
        } else if (group) {
          postData = {
            ...postData,
            owner_group_name: group.name,
            owner_group_slug: group.slug,
            owner_group_country_code: group.country_code,
          };
        }
      }

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

async function fetchComments(after?: string | null, append = false) {
  if (!post.value || !post.value.id) return;
  if (append) {
    isLoadingMoreComments.value = true;
  } else {
    isLoadingComments.value = true;
  }
  commentsError.value = null;
  try {
    let query = supabase
      .from('comments_with_author_info')
      .select('*')
      .eq('post_id', post.value.id)
      .order('created_at', { ascending: true })
      .limit(COMMENTS_PAGE_SIZE);

    if (after) {
      query = query.gt('created_at', after);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []) as CommentWithAuthor[];
    if (append) {
      const existing = new Set(comments.value.map((c) => c.id));
      comments.value = [...comments.value, ...rows.filter((c) => c.id && !existing.has(c.id))];
    } else {
      comments.value = rows;
    }
    hasMoreComments.value = rows.length >= COMMENTS_PAGE_SIZE;
  } catch (e: any) {
    console.error("Erro ao buscar comentários:", e);
    commentsError.value = e.message || 'Falha ao carregar comentários.';
    toast.error(commentsError.value);
    if (!append) {
      comments.value = [];
      hasMoreComments.value = false;
    }
  } finally {
    isLoadingComments.value = false;
    isLoadingMoreComments.value = false;
  }
}

async function loadMoreComments() {
  if (isLoadingMoreComments.value || !hasMoreComments.value || comments.value.length === 0) return;
  const last = comments.value[comments.value.length - 1];
  if (!last?.created_at) return;
  await fetchComments(last.created_at, true);
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

function handleCommentDeleted(commentId: string) {
  comments.value = comments.value.filter((c) => c.id !== commentId);
  if (post.value?.comments_count != null) {
    post.value.comments_count = Math.max(0, (post.value.comments_count || 0) - 1);
  }
}

function handleCommentUpdated(payload: { id: string; text_content: string | null; image_path: string | null; video_url: string | null; is_edited: boolean; updated_at: string }) {
  const index = comments.value.findIndex((c) => c.id === payload.id);
  if (index === -1) return;
  comments.value[index] = {
    ...comments.value[index],
    text_content: payload.text_content,
    image_path: payload.image_path,
    video_url: payload.video_url,
    is_edited: payload.is_edited,
    updated_at: payload.updated_at,
  };
}

async function handlePostDeleted() {
  await navigateTo(goBackLink.value);
}

function handlePostUpdated(payload: { id: string; text_content: string | null; image_path: string | null; video_url: string | null; is_edited: boolean; updated_at: string }) {
  if (!post.value || post.value.id !== payload.id) return;
  post.value = {
    ...post.value,
    text_content: payload.text_content,
    image_path: payload.image_path,
    video_url: payload.video_url,
    is_edited: payload.is_edited,
    updated_at: payload.updated_at,
  };
}

useHead({
  title: 'Post - TruthSeek Network'
});

watch(blockedIds, () => {
  if (post.value?.author_id && isAuthorHidden(post.value.author_id)) {
    post.value = null;
    comments.value = [];
    postError.value = 'Este post não está disponível.';
  }
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

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1.25rem;
}

.load-more-wrap .button-secondary {
  min-width: 10rem;
}
</style>