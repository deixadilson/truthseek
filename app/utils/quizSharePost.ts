import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/supabase';

const QUIZ_SHARE_IMAGE_VERSION = 'v1';

export function quizResultImagePath(ideologyId: string, scorePercent: number): string {
  return `quiz-results/${QUIZ_SHARE_IMAGE_VERSION}/${ideologyId}/${scorePercent}.png`;
}

function isAlreadyExistsError(error: {
  message?: string;
  statusCode?: string | number;
  status?: number;
  error?: string;
} | null): boolean {
  if (!error) return false;
  const msg = `${error.message || ''} ${error.error || ''}`.toLowerCase();
  const code = String(error.statusCode ?? error.status ?? '');
  return (
    code === '409'
    || msg.includes('already exists')
    || msg.includes('duplicate')
    || msg.includes('resource already exists')
  );
}

/** Upload PNG to a deterministic path, or reuse if another user already uploaded the same result. */
export async function ensureQuizResultImagePath(
  supabase: SupabaseClient<Database>,
  blob: Blob,
  ideologyId: string,
  scorePercent: number,
): Promise<string> {
  const path = quizResultImagePath(ideologyId, scorePercent);
  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(path, blob, {
      upsert: false,
      contentType: 'image/png',
      cacheControl: '31536000',
    });

  if (error && !isAlreadyExistsError(error)) throw error;
  return data?.path || path;
}

export type PublishQuizResultInput = {
  supabase: SupabaseClient<Database>;
  authorId: string;
  hostGroupId: string;
  ideologyId: string;
  scorePercent: number;
  imageBlob: Blob;
  textContent: string;
  isModerated?: boolean;
};

export async function publishQuizResultPost(input: PublishQuizResultInput): Promise<{ id: string }> {
  const imagePath = await ensureQuizResultImagePath(
    input.supabase,
    input.imageBlob,
    input.ideologyId,
    input.scorePercent,
  );

  const { data, error } = await input.supabase
    .from('posts')
    .insert({
      author_id: input.authorId,
      owner_id: input.hostGroupId,
      owner_type: 'group',
      text_content: input.textContent.trim() || null,
      image_path: imagePath,
      video_url: null,
      is_anonymous: false,
      is_moderated: !!input.isModerated,
    })
    .select('id')
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error('Post criado sem id.');
  return { id: data.id };
}
