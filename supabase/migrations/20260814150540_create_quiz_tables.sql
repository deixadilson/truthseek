-- Quiz: propositions (1 per leaf issue) + ideology stances + user attempts.

CREATE TABLE IF NOT EXISTS public.quiz_propositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL UNIQUE REFERENCES public.issues(id) ON DELETE CASCADE,
  host_group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  statement text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quiz_propositions_statement_not_blank CHECK (length(btrim(statement)) > 0)
);

COMMENT ON TABLE public.quiz_propositions IS
  'Quiz statements, typically one per leaf issue under a host group with subgroups.';

CREATE INDEX IF NOT EXISTS quiz_propositions_host_group_id_idx
  ON public.quiz_propositions (host_group_id, sort_order)
  WHERE is_active;

CREATE TABLE IF NOT EXISTS public.quiz_ideology_stances (
  proposition_id uuid NOT NULL REFERENCES public.quiz_propositions(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  stance smallint,
  PRIMARY KEY (proposition_id, group_id),
  CONSTRAINT quiz_ideology_stances_stance_range
    CHECK (stance IS NULL OR stance BETWEEN -2 AND 2)
);

COMMENT ON COLUMN public.quiz_ideology_stances.stance IS
  'Likert -2..2; NULL means ideology has no defined position on this proposition.';

CREATE INDEX IF NOT EXISTS quiz_ideology_stances_group_id_idx
  ON public.quiz_ideology_stances (group_id);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  host_group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS quiz_attempts_host_group_id_idx
  ON public.quiz_attempts (host_group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx
  ON public.quiz_attempts (user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  proposition_id uuid NOT NULL REFERENCES public.quiz_propositions(id) ON DELETE CASCADE,
  answer smallint NOT NULL,
  PRIMARY KEY (attempt_id, proposition_id),
  CONSTRAINT quiz_attempt_answers_answer_range CHECK (answer BETWEEN -2 AND 2)
);

-- Leaf ideology groups under a host (closed groups without subgroups, plus
-- closed grandchildren under containers that have subgroups).
CREATE OR REPLACE FUNCTION public.get_quiz_target_groups(p_host_group_id uuid)
RETURNS SETOF public.groups
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM (
    SELECT g.*
    FROM public.groups g
    WHERE g.parent_group_id = p_host_group_id
      AND g.is_open IS NOT TRUE
      AND g.has_subgroups IS NOT TRUE
    UNION
    SELECT child.*
    FROM public.groups mid
    JOIN public.groups child ON child.parent_group_id = mid.id
    WHERE mid.parent_group_id = p_host_group_id
      AND mid.has_subgroups IS TRUE
      AND child.is_open IS NOT TRUE
      AND child.has_subgroups IS NOT TRUE
  ) targets
  ORDER BY name;
$$;

COMMENT ON FUNCTION public.get_quiz_target_groups(uuid) IS
  'Closed leaf ideology groups that appear in quiz results for a host group.';

CREATE OR REPLACE FUNCTION public.get_quiz_for_group(p_host_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'host_group_id', p_host_group_id,
    'ideologies', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'name', g.name,
          'slug', g.slug,
          'country_code', g.country_code,
          'flag_path', g.flag_path,
          'description', g.description
        )
        ORDER BY g.name
      )
      FROM public.get_quiz_target_groups(p_host_group_id) g
    ), '[]'::jsonb),
    'propositions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'issue_id', p.issue_id,
          'statement', p.statement,
          'sort_order', p.sort_order,
          'stances', COALESCE((
            SELECT jsonb_object_agg(s.group_id::text, s.stance)
            FROM public.quiz_ideology_stances s
            WHERE s.proposition_id = p.id
          ), '{}'::jsonb)
        )
        ORDER BY p.sort_order, p.statement
      )
      FROM public.quiz_propositions p
      WHERE p.host_group_id = p_host_group_id
        AND p.is_active
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_quiz_for_group(uuid) IS
  'Active quiz propositions and ideology stances for a host group.';

CREATE OR REPLACE FUNCTION public.host_group_has_quiz(p_host_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quiz_propositions p
    WHERE p.host_group_id = p_host_group_id
      AND p.is_active
  );
$$;

ALTER TABLE public.quiz_propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_ideology_stances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to quiz_propositions" ON public.quiz_propositions;
CREATE POLICY "Allow public read access to quiz_propositions"
  ON public.quiz_propositions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to quiz_ideology_stances" ON public.quiz_ideology_stances;
CREATE POLICY "Allow public read access to quiz_ideology_stances"
  ON public.quiz_ideology_stances FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Allow insert quiz_attempts"
  ON public.quiz_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Allow read own quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Allow read own quiz_attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow update own quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Allow update own quiz_attempts"
  ON public.quiz_attempts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow update anonymous quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Allow update anonymous quiz_attempts"
  ON public.quiz_attempts FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Allow insert quiz_attempt_answers" ON public.quiz_attempt_answers;
CREATE POLICY "Allow insert quiz_attempt_answers"
  ON public.quiz_attempt_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts a
      WHERE a.id = attempt_id
        AND (a.user_id IS NULL OR a.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow read own quiz_attempt_answers" ON public.quiz_attempt_answers;
CREATE POLICY "Allow read own quiz_attempt_answers"
  ON public.quiz_attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts a
      WHERE a.id = attempt_id
        AND a.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.quiz_propositions TO anon, authenticated;
GRANT SELECT ON public.quiz_ideology_stances TO anon, authenticated;
GRANT SELECT, INSERT ON public.quiz_attempts TO anon, authenticated;
GRANT UPDATE ON public.quiz_attempts TO anon, authenticated;
GRANT SELECT, INSERT ON public.quiz_attempt_answers TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_quiz_target_groups(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_for_group(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.host_group_has_quiz(uuid) TO anon, authenticated;
