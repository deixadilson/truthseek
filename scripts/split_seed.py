"""Split seed SQL into chunks for MCP apply."""
from pathlib import Path

sql = Path("scripts/seed_premises.sql").read_text(encoding="utf-8")
# Extract VALUES rows
start = sql.index("FROM (VALUES")
end = sql.index(") AS v(slug, sort_order, axis_key, name, description)")
values_block = sql[start + len("FROM (VALUES") : end].strip()
# rows start with (
rows = []
buf = []
depth = 0
for line in values_block.splitlines():
    line = line.rstrip().rstrip(",")
    if not line.strip():
        continue
    rows.append(line)

# 3 chunks of rows
n = len(rows)
print(f"total rows: {n}")
size = (n + 2) // 3
chunks = [rows[i : i + size] for i in range(0, n, size)]

header = """DELETE FROM public.premise_oppositions;
DELETE FROM public.premises;
"""
Path("scripts/seed_chunks").mkdir(exist_ok=True)
Path("scripts/seed_chunks/00_clear.sql").write_text(header, encoding="utf-8")

for i, chunk in enumerate(chunks):
    body = ",\n".join(chunk)
    q = f"""INSERT INTO public.premises (group_id, name, description, sort_order, axis_key)
SELECT g.id, v.name, v.description, v.sort_order, v.axis_key
FROM (VALUES
{body}
) AS v(slug, sort_order, axis_key, name, description)
JOIN public.groups g ON g.slug = v.slug AND g.is_open = false;
"""
    Path(f"scripts/seed_chunks/{i+1:02d}_insert.sql").write_text(q, encoding="utf-8")
    print(f"chunk {i+1}: {len(chunk)} rows, {len(q)} chars")

opp = """
INSERT INTO public.premise_oppositions (premise_id_a, premise_id_b)
SELECT DISTINCT LEAST(p1.id, p2.id), GREATEST(p1.id, p2.id)
FROM public.premises p1
JOIN public.premises p2
  ON p1.axis_key IS NOT NULL
 AND p1.axis_key = p2.axis_key
 AND p1.id < p2.id
JOIN public.groups g1 ON g1.id = p1.group_id
JOIN public.groups g2 ON g2.id = p2.group_id
JOIN public.group_oppositions go
  ON go.group_id_a = LEAST(g1.id, g2.id)
 AND go.group_id_b = GREATEST(g1.id, g2.id)
ON CONFLICT DO NOTHING;

INSERT INTO public.premise_oppositions (premise_id_a, premise_id_b)
SELECT DISTINCT LEAST(p1.id, p2.id), GREATEST(p1.id, p2.id)
FROM public.premises p1
JOIN public.premises p2
  ON p1.axis_key IS NOT NULL
 AND p1.axis_key = p2.axis_key
 AND p1.id < p2.id
JOIN public.groups g1 ON g1.id = p1.group_id
JOIN public.groups g2 ON g2.id = p2.group_id
WHERE g1.parent_group_id IS NOT NULL
  AND g1.parent_group_id = g2.parent_group_id
  AND g1.slug LIKE 'saude/dietas/%'
  AND g2.slug LIKE 'saude/dietas/%'
ON CONFLICT DO NOTHING;
"""
Path("scripts/seed_chunks/99_oppositions.sql").write_text(opp, encoding="utf-8")
print("done")
