-- Tags/topics that can be attached to group posts.
-- Defined on a group; available on that group, its ancestors (parents inherit
-- children) and its descendants (children can reuse the parent catalog).

CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  parent_issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT issues_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT issues_slug_not_blank CHECK (length(btrim(slug)) > 0),
  CONSTRAINT issues_no_self_parent CHECK (parent_issue_id IS DISTINCT FROM id)
);

COMMENT ON TABLE public.issues IS 'Topic tags for posts. Defined on a group and inherited along the group tree.';
COMMENT ON COLUMN public.issues.parent_issue_id IS 'Optional parent issue in the same group. Only one extra level (sub-issue) is allowed.';
COMMENT ON COLUMN public.issues.group_id IS 'Group where this issue is defined. Ancestors and descendants may also use it.';

CREATE UNIQUE INDEX IF NOT EXISTS issues_group_slug_unique
  ON public.issues (group_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS issues_group_root_name_unique
  ON public.issues (group_id, name)
  WHERE parent_issue_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS issues_group_child_name_unique
  ON public.issues (group_id, parent_issue_id, name)
  WHERE parent_issue_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS issues_group_id_idx
  ON public.issues (group_id, sort_order);

CREATE INDEX IF NOT EXISTS issues_parent_issue_id_idx
  ON public.issues (parent_issue_id);

CREATE OR REPLACE FUNCTION public.issues_validate_parent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_parent public.issues%ROWTYPE;
BEGIN
  IF NEW.parent_issue_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_issue_id = NEW.id THEN
    RAISE EXCEPTION 'issue cannot be its own parent';
  END IF;

  SELECT * INTO v_parent
  FROM public.issues
  WHERE id = NEW.parent_issue_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'parent issue not found';
  END IF;

  IF v_parent.group_id IS DISTINCT FROM NEW.group_id THEN
    RAISE EXCEPTION 'parent issue must belong to the same group';
  END IF;

  IF v_parent.parent_issue_id IS NOT NULL THEN
    RAISE EXCEPTION 'sub-issues cannot have children';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS issues_validate_parent ON public.issues;
CREATE TRIGGER issues_validate_parent
  BEFORE INSERT OR UPDATE OF parent_issue_id, group_id, id
  ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.issues_validate_parent();

CREATE OR REPLACE FUNCTION public.issue_is_available_for_group(
  p_issue_group_id uuid,
  p_target_group_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT id, parent_group_id
    FROM public.groups
    WHERE id = p_target_group_id
    UNION ALL
    SELECT g.id, g.parent_group_id
    FROM public.groups g
    JOIN ancestors a ON g.id = a.parent_group_id
  ),
  descendants AS (
    SELECT id, parent_group_id
    FROM public.groups
    WHERE parent_group_id = p_target_group_id
    UNION ALL
    SELECT g.id, g.parent_group_id
    FROM public.groups g
    JOIN descendants d ON g.parent_group_id = d.id
  )
  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT id FROM ancestors
      UNION
      SELECT id FROM descendants
    ) scope
    WHERE scope.id = p_issue_group_id
  );
$$;

COMMENT ON FUNCTION public.issue_is_available_for_group(uuid, uuid) IS
  'True when an issue defined on p_issue_group_id can be used on p_target_group_id (same group, ancestor, or descendant).';

CREATE OR REPLACE FUNCTION public.get_issues_for_group(p_group_id uuid)
RETURNS SETOF public.issues
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT id, parent_group_id
    FROM public.groups
    WHERE id = p_group_id
    UNION ALL
    SELECT g.id, g.parent_group_id
    FROM public.groups g
    JOIN ancestors a ON g.id = a.parent_group_id
  ),
  descendants AS (
    SELECT id, parent_group_id
    FROM public.groups
    WHERE parent_group_id = p_group_id
    UNION ALL
    SELECT g.id, g.parent_group_id
    FROM public.groups g
    JOIN descendants d ON g.parent_group_id = d.id
  ),
  scope AS (
    SELECT id FROM ancestors
    UNION
    SELECT id FROM descendants
  )
  SELECT i.*
  FROM public.issues i
  WHERE i.group_id IN (SELECT id FROM scope)
  ORDER BY
    COALESCE(
      (SELECT p.sort_order FROM public.issues p WHERE p.id = i.parent_issue_id),
      i.sort_order
    ),
    i.parent_issue_id NULLS FIRST,
    i.sort_order,
    i.name;
$$;

COMMENT ON FUNCTION public.get_issues_for_group(uuid) IS
  'Issues that may be attached to posts in the given group, including inherited ones.';

CREATE TABLE IF NOT EXISTS public.post_issues (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, issue_id)
);

COMMENT ON TABLE public.post_issues IS 'Junction between posts and issue tags.';

CREATE INDEX IF NOT EXISTS post_issues_issue_id_idx
  ON public.post_issues (issue_id);

CREATE OR REPLACE FUNCTION public.post_issues_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_type text;
  v_owner_id uuid;
  v_issue_group_id uuid;
BEGIN
  SELECT owner_type, owner_id
  INTO v_owner_type, v_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post not found';
  END IF;

  IF v_owner_type IS DISTINCT FROM 'group' THEN
    RAISE EXCEPTION 'issues can only be attached to group posts';
  END IF;

  SELECT group_id INTO v_issue_group_id
  FROM public.issues
  WHERE id = NEW.issue_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'issue not found';
  END IF;

  IF NOT public.issue_is_available_for_group(v_issue_group_id, v_owner_id) THEN
    RAISE EXCEPTION 'issue is not available for this group';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_issues_validate ON public.post_issues;
CREATE TRIGGER post_issues_validate
  BEFORE INSERT OR UPDATE OF post_id, issue_id
  ON public.post_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.post_issues_validate();

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to issues" ON public.issues;
CREATE POLICY "Allow public read access to issues"
  ON public.issues
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read access to post_issues" ON public.post_issues;
CREATE POLICY "Allow public read access to post_issues"
  ON public.post_issues
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authors can attach issues to their posts" ON public.post_issues;
CREATE POLICY "Authors can attach issues to their posts"
  ON public.post_issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.author_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authors can detach issues from their posts" ON public.post_issues;
CREATE POLICY "Authors can detach issues from their posts"
  ON public.post_issues
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.author_id = (SELECT auth.uid())
    )
  );

GRANT SELECT ON public.issues TO anon, authenticated;
GRANT ALL ON public.issues TO service_role;

GRANT SELECT ON public.post_issues TO anon, authenticated;
GRANT INSERT, DELETE ON public.post_issues TO authenticated;
GRANT ALL ON public.post_issues TO service_role;

GRANT EXECUTE ON FUNCTION public.issue_is_available_for_group(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_issues_for_group(uuid) TO anon, authenticated;
