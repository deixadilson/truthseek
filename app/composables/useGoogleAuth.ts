export function useGoogleAuth() {
  const supabase = useSupabaseClient();

  async function signInWithGoogle(redirectTo?: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${origin}/user/confirm`,
        // Ensure profile picture is included in user_metadata (avatar_url / picture)
        queryParams: {
          access_type: 'online',
          prompt: 'select_account',
        },
        scopes: 'openid email profile',
      },
    });
  }

  return { signInWithGoogle };
}
