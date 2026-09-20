export function useGoogleAuth() {
  const supabase = useSupabaseClient();

  async function signInWithGoogle(redirectTo?: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${origin}/user/confirm`,
      },
    });
  }

  return { signInWithGoogle };
}
