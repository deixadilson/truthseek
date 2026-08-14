-- Restore AnCom +2 on Saneamento; include description in get_quiz_for_group.

UPDATE public.quiz_ideology_stances s
SET stance = 2
WHERE s.group_id IN (
  SELECT g.id
  FROM public.groups g
  WHERE g.slug = 'politica/ideologias/anarquismo/anarcocomunismo'
    AND g.country_code = 'br'
)
AND s.proposition_id IN (
  SELECT qp.id
  FROM public.quiz_propositions qp
  JOIN public.issues i ON i.id = qp.issue_id
  JOIN public.groups hg ON hg.id = qp.host_group_id
  WHERE hg.slug = 'politica/ideologias'
    AND hg.country_code = 'br'
    AND i.slug = 'saneamento'
);

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
