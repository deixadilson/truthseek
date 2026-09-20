const ALLOWED_WHEN_INCOMPLETE = new Set([
  '/user/complete-profile',
  '/user/confirm',
  '/user/login',
  '/user/signup',
  '/user/register',
  '/user/password-recovery',
  '/user/password-reset',
  '/terms-of-service',
  '/privacy-policy',
]);

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();
  if (!user.value) return;

  if (ALLOWED_WHEN_INCOMPLETE.has(to.path)) return;

  const userId = user.value.sub;
  if (!userId) return;

  const userProfile = useProfile();
  if (userProfile.value && userProfile.value.id === userId) {
    if (!isProfileComplete(userProfile.value)) {
      return navigateTo('/user/complete-profile');
    }
    return;
  }

  const supabase = useSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, gender, birth_date')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar perfil incompleto:', error);
    return;
  }

  if (!data || !isProfileComplete(data)) {
    return navigateTo('/user/complete-profile');
  }
});
