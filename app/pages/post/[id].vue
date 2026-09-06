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
          v-if="user && post && post.id && canComment"
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
        <div v-else-if="post && user && !canComment" class="guest-comment-prompt">
          <p>
            Para comentar neste grupo de debate é necessário estar entre os
            <strong>50% mais influentes</strong> (Apologista ou superior) em um dos vieses.
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
            :post-owner-group-id="post.owner_type === 'group' ? post.owner_id : null"
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
          v-if="user && post && post.id && canComment && replyingToCommentId"
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
import { canEnterClosedGroup, canEnterVsGroup } from '~/utils/formatters';
import { buildPostOgMeta } from '~/utils/postOg';
import { buildVsPath, orderVsSides, vsDisplayTitle } from '~/utils/vsGroups';

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const authUserId = useAuthUserId();
const toast = useToast();
const { isAuthorHidden, blockedIds } = useBlock();
const runtimeConfig = useRuntimeConfig();
const requestURL = useRequestURL();

const postId = computed(() => String(route.params.id || ''));
const post = ref<PostWithAuthor | null>(null);
const comments = ref<CommentWithAuthor[]>([]);

const { loadForAuthors, rankFor, ranks } = useGroupAuthorRanks(
  () => (post.value?.owner_type === 'group' ? post.value.owner_id : null)
);
provide('groupAuthorRanks', { rankFor, ranks });

watch(
  () =>
    [
      post.value?.owner_id,
      post.value?.owner_type,
      post.value?.author_id,
      comments.value.map((c) => c.author_id).join(','),
    ] as const,
  () => {
    if (post.value?.owner_type !== 'group' || !post.value?.owner_id) return;
    void loadForAuthors([
      post.value.author_id,
      ...comments.value.map((c) => c.author_id),
    ]);
  },
  { immediate: true }
);

const isLoadingPost = ref(true);
const postError = ref<string | null>(null);
const isLoadingComments = ref(false);
const isLoadingMoreComments = ref(false);
const hasMoreComments = ref(false);
const commentsError = ref<string | null>(null);
/** False when the post exists but must not leak into OG / page for this viewer. */
const postPubliclyVisible = ref(false);

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
const canComment = ref(false);
const vsBackPath = ref<string | null>(null);

const goBackLink = computed(() => {
  if (vsBackPath.value) return vsBackPath.value;
  if (
    post.value?.owner_type === 'group'
    && post.value.owner_group_country_code
    && post.value.owner_group_slug
  ) {
    return `/${post.value.owner_group_country_code}/${post.value.owner_group_slug}`;
  }
  return '/categories';
});

const siteOrigin = computed(() => {
  const configured = String(runtimeConfig.public.siteUrl || '').replace(/\/$/, '');
  if (configured) return configured;
  return requestURL.origin;
});

/** Guests and low-influence users may only open posts from open groups. VS posts are public to read. */
async function canViewPost(postData: PostWithAuthor): Promise<boolean> {
  if (postData.owner_type === 'vs_group') {
    return true;
  }

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

  // Closed group: 20+ points or top 50% (level ≥ 5)
  if (!authUserId.value) return false;

  const { data: bias } = await supabase
    .from('biases')
    .select('influence_points, level')
    .eq('user_id', authUserId.value)
    .eq('group_id', group.id)
    .maybeSingle();

  return canEnterClosedGroup(bias);
}

async function resolveVsPostContext(vsId: string): Promise<{
  canComment: boolean;
  backPath: string | null;
  displayName: string | null;
  countryCode: string | null;
  pathSlug: string | null;
}> {
  const empty = {
    canComment: false,
    backPath: null,
    displayName: null,
    countryCode: null,
    pathSlug: null,
  };

  const { data: vs, error: vsError } = await supabase
    .from('vs_groups')
    .select('id, country_code, group_id_1, group_id_2')
    .eq('id', vsId)
    .maybeSingle();

  if (vsError || !vs) return empty;

  const { data: sides, error: sidesError } = await supabase
    .from('groups')
    .select('id, name, slug, country_code, flag_path, parent_group_id, category_group_id, is_open, cover_image_path')
    .in('id', [vs.group_id_1, vs.group_id_2]);

  if (sidesError || !sides || sides.length < 2) return empty;

  const gA = sides.find((g) => g.id === vs.group_id_1);
  const gB = sides.find((g) => g.id === vs.group_id_2);
  if (!gA || !gB) return empty;

  const ordered = orderVsSides(gA, gB);
  const backPath = buildVsPath(vs.country_code, ordered.left, ordered.right);
  const pathSlug = backPath
    ? backPath.replace(new RegExp(`^/${vs.country_code}/`), '')
    : null;

  let allowedToComment = false;
  if (authUserId.value) {
    const { data: biases } = await supabase
      .from('biases')
      .select('group_id, level')
      .eq('user_id', authUserId.value)
      .in('group_id', [vs.group_id_1, vs.group_id_2]);

    allowedToComment = canEnterVsGroup(...(biases || []));
  }

  return {
    canComment: allowedToComment,
    backPath,
    displayName: vsDisplayTitle(ordered.left, ordered.right),
    countryCode: vs.country_code,
    pathSlug,
  };
}

type PostLoadResult = {
  post: PostWithAuthor | null;
  errorMessage: string | null;
  visible: boolean;
};

async function loadPostById(id: string): Promise<PostLoadResult> {
  if (!id) {
    return { post: null, errorMessage: 'ID do post não encontrado na URL.', visible: false };
  }

  const { data, error } = await supabase
    .from('posts_with_author_info')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { post: null, errorMessage: 'Post não encontrado.', visible: false };
    }
    throw error;
  }

  if (!data) {
    return { post: null, errorMessage: 'Post não encontrado.', visible: false };
  }

  let postData = data as PostWithAuthor;
  canComment.value = false;
  vsBackPath.value = null;

  // Resolve owner display context
  if (postData.owner_type === 'group' && postData.owner_id) {
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
    // Viewing a group post already implies comment access for that group.
    canComment.value = true;
  } else if (postData.owner_type === 'vs_group' && postData.owner_id) {
    const vsCtx = await resolveVsPostContext(postData.owner_id);
    vsBackPath.value = vsCtx.backPath;
    canComment.value = vsCtx.canComment;
    if (vsCtx.displayName && vsCtx.countryCode && vsCtx.pathSlug) {
      postData = {
        ...postData,
        owner_group_name: vsCtx.displayName,
        owner_group_slug: vsCtx.pathSlug,
        owner_group_country_code: vsCtx.countryCode,
      };
    }
  } else {
    // Timeline / other: logged-in users may comment.
    canComment.value = !!authUserId.value;
  }

  const allowed = await canViewPost(postData);
  if (!allowed) {
    return {
      post: null,
      errorMessage: authUserId.value
        ? 'Você não tem influência suficiente para ver este post de grupo fechado.'
        : 'Este post pertence a um grupo fechado. Crie uma conta e declare o viés para acessá-lo.',
      visible: false,
    };
  }

  return { post: postData, errorMessage: null, visible: true };
}

const { data: postLoad, pending: postPending, error: postLoadError } = await useAsyncData(
  () => `post-page-${postId.value}`,
  async () => loadPostById(postId.value)
);

function applyPostLoadResult() {
  isLoadingPost.value = postPending.value;
  if (postPending.value) return;

  if (postLoadError.value) {
    console.error('Erro ao buscar post:', postLoadError.value);
    post.value = null;
    postPubliclyVisible.value = false;
    postError.value = postLoadError.value.message || 'Falha ao carregar o post.';
    if (import.meta.client) toast.error(postError.value);
    return;
  }

  const result = postLoad.value;
  post.value = result?.post ?? null;
  postPubliclyVisible.value = !!result?.visible;
  postError.value = result?.errorMessage ?? null;
}

applyPostLoadResult();
watch([postLoad, postPending, postLoadError], applyPostLoadResult);

const ogMeta = computed(() => {
  // Prefer live `post` (edits) but fall back to async payload for SSR head tags.
  const loaded = postLoad.value?.visible ? postLoad.value.post : null;
  const current = post.value ?? loaded;
  const visible = !!(postPubliclyVisible.value || postLoad.value?.visible) && !!current;

  return buildPostOgMeta({
    siteOrigin: siteOrigin.value,
    postId: postId.value || current?.id || 'unknown',
    textContent: visible ? current?.text_content : null,
    imagePath: visible ? current?.image_path : null,
    isAnonymous: visible ? current?.is_anonymous : true,
    authorUsername: visible ? current?.author_username : null,
    groupName: visible ? current?.owner_group_name : null,
    visible,
  });
});

useSeoMeta({
  title: () => ogMeta.value.title,
  description: () => ogMeta.value.description,
  ogTitle: () => ogMeta.value.title,
  ogDescription: () => ogMeta.value.description,
  ogType: 'article',
  ogUrl: () => ogMeta.value.url,
  ogImage: () => ogMeta.value.image,
  ogImageAlt: () => ogMeta.value.imageAlt,
  ogImageType: () =>
    ogMeta.value.image.endsWith('.png')
      ? 'image/png'
      : ogMeta.value.image.match(/\.jpe?g(\?|$)/i)
        ? 'image/jpeg'
        : ogMeta.value.image.endsWith('.webp')
          ? 'image/webp'
          : undefined,
  ogSiteName: 'TruthSeek Network',
  twitterCard: 'summary_large_image',
  twitterTitle: () => ogMeta.value.title,
  twitterDescription: () => ogMeta.value.description,
  twitterImage: () => ogMeta.value.image,
});

useHead(() => ({
  link: [{ rel: 'canonical', href: ogMeta.value.url }],
}));

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
  if (!canComment.value) {
    toast.info('Você não tem permissão para comentar neste grupo de debate.');
    return;
  }
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

watch(blockedIds, () => {
  if (post.value?.author_id && isAuthorHidden(post.value.author_id)) {
    post.value = null;
    comments.value = [];
    postPubliclyVisible.value = false;
    postError.value = 'Este post não está disponível.';
  }
});

watch(
  () => post.value?.id,
  (id) => {
    comments.value = [];
    hasMoreComments.value = false;
    if (id && import.meta.client) {
      void fetchComments();
    }
  },
  { immediate: true }
);

watch(authUserId, async () => {
  if (!post.value) return;

  if (post.value.owner_type === 'vs_group' && post.value.owner_id) {
    const vsCtx = await resolveVsPostContext(post.value.owner_id);
    canComment.value = vsCtx.canComment;
    vsBackPath.value = vsCtx.backPath;
    if (!canComment.value) cancelReply();
    return;
  }

  if (post.value.owner_type === 'group') {
    canComment.value = true;
    return;
  }

  canComment.value = !!authUserId.value;
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