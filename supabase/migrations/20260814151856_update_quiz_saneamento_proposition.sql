-- Update Saneamento proposition wording and set AnCom stance to NULL (N/A).

UPDATE public.quiz_propositions qp
SET statement = 'Saneamento básico universal deve ser prioridade pública, mesmo exigindo investimento elevado e regulação forte.'
FROM public.issues i
JOIN public.groups hg
  ON hg.id = i.group_id
WHERE qp.issue_id = i.id
  AND i.slug = 'saneamento'
  AND hg.slug = 'politica/ideologias'
  AND hg.country_code = 'br';

UPDATE public.quiz_ideology_stances s
SET stance = NULL
WHERE s.proposition_id IN (
  SELECT qp.id
  FROM public.quiz_propositions qp
  JOIN public.issues i ON i.id = qp.issue_id
  JOIN public.groups hg ON hg.id = qp.host_group_id
  WHERE i.slug = 'saneamento'
    AND hg.slug = 'politica/ideologias'
    AND hg.country_code = 'br'
)
AND s.group_id IN (
  SELECT g.id
  FROM public.groups g
  WHERE g.slug = 'politica/ideologias/anarquismo/anarcocomunismo'
    AND g.country_code = 'br'
);
