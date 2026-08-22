-- Make quiz proposition issue tags optional and many-to-many.
-- Drops quiz_propositions.issue_id (NOT NULL UNIQUE) in favor of quiz_proposition_issues.

CREATE TABLE IF NOT EXISTS public.quiz_proposition_issues (
  proposition_id uuid NOT NULL REFERENCES public.quiz_propositions(id) ON DELETE CASCADE,
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (proposition_id, issue_id)
);

COMMENT ON TABLE public.quiz_proposition_issues IS
  'Optional many-to-many tags linking quiz propositions to issues.';

CREATE INDEX IF NOT EXISTS quiz_proposition_issues_issue_id_idx
  ON public.quiz_proposition_issues (issue_id);

-- Preserve existing 1:1 links
INSERT INTO public.quiz_proposition_issues (proposition_id, issue_id)
SELECT qp.id, qp.issue_id
FROM public.quiz_propositions qp
WHERE qp.issue_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.quiz_propositions
  DROP CONSTRAINT IF EXISTS quiz_propositions_issue_id_fkey;

ALTER TABLE public.quiz_propositions
  DROP CONSTRAINT IF EXISTS quiz_propositions_issue_id_key;

ALTER TABLE public.quiz_propositions
  DROP COLUMN IF EXISTS issue_id;

COMMENT ON TABLE public.quiz_propositions IS
  'Quiz statements for a host group. Optional issue tags live in quiz_proposition_issues.';

ALTER TABLE public.quiz_proposition_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to quiz_proposition_issues"
  ON public.quiz_proposition_issues;
CREATE POLICY "Allow public read access to quiz_proposition_issues"
  ON public.quiz_proposition_issues FOR SELECT USING (true);

GRANT SELECT ON public.quiz_proposition_issues TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_quiz_for_group(p_host_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
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
          'issue_ids', COALESCE((
            SELECT jsonb_agg(qpi.issue_id ORDER BY qpi.issue_id)
            FROM public.quiz_proposition_issues qpi
            WHERE qpi.proposition_id = p.id
          ), '[]'::jsonb),
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
$function$;

COMMENT ON FUNCTION public.get_quiz_for_group(uuid) IS
  'Active quiz propositions (with optional issue_ids) and ideology stances for a host group.';
