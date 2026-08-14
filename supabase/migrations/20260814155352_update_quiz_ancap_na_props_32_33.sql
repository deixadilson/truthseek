-- AnCap = N/A on propositions 32 (mulheres-trans-esportes) and 33 (banheiro-lgbtq).

UPDATE public.quiz_ideology_stances s
SET stance = NULL
WHERE s.group_id IN (
  SELECT g.id
  FROM public.groups g
  WHERE g.slug = 'politica/ideologias/anarquismo/anarcocapitalismo'
    AND g.country_code = 'br'
)
AND s.proposition_id IN (
  SELECT qp.id
  FROM public.quiz_propositions qp
  JOIN public.issues i ON i.id = qp.issue_id
  JOIN public.groups hg ON hg.id = qp.host_group_id
  WHERE hg.slug = 'politica/ideologias'
    AND hg.country_code = 'br'
    AND i.slug IN ('mulheres-trans-esportes', 'banheiro-lgbtq')
);
