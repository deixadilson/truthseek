-- Permanent MetaGrupo TruthSeek bias for every user.
-- Auto-assign on signup, backfill existing users, and block removal.

-- 1) Backfill: one TruthSeek bias per existing profile
INSERT INTO public.biases (user_id, group_id, influence_points, title)
SELECT
  p.id,
  g.id,
  10,
  'Aspirante'
FROM public.profiles p
CROSS JOIN public.groups g
WHERE g.slug = 'truthseek'
  AND g.country_code = 'br'
ON CONFLICT (user_id, group_id) DO NOTHING;

-- 2) Signup trigger: create profile + permanent TruthSeek bias
CREATE OR REPLACE FUNCTION public.public_create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_truthseek_group_id uuid;
BEGIN
  INSERT INTO public.profiles (id, username, country_code, gender, birth_date)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'country_code',
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'birth_date')::date
  );

  SELECT g.id INTO v_truthseek_group_id
  FROM public.groups g
  WHERE g.slug = 'truthseek'
    AND g.country_code = 'br'
  LIMIT 1;

  IF v_truthseek_group_id IS NOT NULL THEN
    INSERT INTO public.biases (user_id, group_id, influence_points, title)
    VALUES (NEW.id, v_truthseek_group_id, 10, 'Aspirante')
    ON CONFLICT (user_id, group_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) RLS: users may delete their own biases except the MetaGrupo TruthSeek bias
DROP POLICY IF EXISTS "Allow users to remove their own bias" ON public.biases;

CREATE POLICY "Allow users to remove their own bias"
ON public.biases
FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = biases.group_id
      AND g.slug = 'truthseek'
      AND g.country_code = 'br'
  )
);
