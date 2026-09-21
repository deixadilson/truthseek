/**
 * Imports Google profile picture into the `avatars` bucket when the user
 * has no `avatar_path` yet. Safe to call multiple times (no-op if already set).
 */
export async function importGoogleAvatarIfNeeded(userId: string): Promise<string | null> {
  const supabase = useSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('Erro ao ler perfil para avatar Google:', profileError);
    return null;
  }
  if (profile?.avatar_path) return profile.avatar_path;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user || authData.user.id !== userId) return null;

  const meta = authData.user.user_metadata || {};
  const pictureUrl = (meta.avatar_url || meta.picture) as string | undefined;
  if (!pictureUrl || typeof pictureUrl !== 'string' || !pictureUrl.startsWith('http')) {
    return null;
  }

  // Prefer server proxy to avoid browser CORS blocks on googleusercontent.
  let blob: Blob;
  try {
    const proxied = await $fetch<{ base64: string; contentType: string }>('/api/fetch-avatar', {
      query: { url: pictureUrl },
    });
    const binary = atob(proxied.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    blob = new Blob([bytes], { type: proxied.contentType || 'image/jpeg' });
  } catch (e) {
    console.warn('Proxy de avatar falhou, tentando fetch direto:', e);
    try {
      const res = await fetch(pictureUrl);
      if (!res.ok) return null;
      blob = await res.blob();
    } catch (fetchErr) {
      console.error('Falha ao baixar avatar do Google:', fetchErr);
      return null;
    }
  }

  const contentType = blob.type || 'image/jpeg';
  const ext = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';
  const filePath = `${userId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('Erro ao enviar avatar Google:', uploadError);
    return null;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_path: filePath, updated_at: new Date().toISOString() } as never)
    .eq('id', userId);

  if (updateError) {
    console.error('Erro ao salvar avatar_path:', updateError);
    return null;
  }

  const userProfile = useProfile();
  if (userProfile.value && userProfile.value.id === userId) {
    userProfile.value = { ...userProfile.value, avatar_path: filePath };
  }

  return filePath;
}
