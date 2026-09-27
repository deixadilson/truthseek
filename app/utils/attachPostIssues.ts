import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostIssueTag, PostWithAuthor } from '~/types/app'

type IssueJoinRow = {
  post_id: string
  issue_id: string
  issues:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null
}

function issueFromJoin(
  value: IssueJoinRow['issues'],
): { id: string; name: string } | null {
  const row = Array.isArray(value) ? value[0] : value
  if (!row?.id || !row.name) return null
  return { id: row.id, name: row.name }
}

/** Loads issue ids and display names for a page of posts. */
export async function attachPostIssues(
  supabase: SupabaseClient<any>,
  rows: PostWithAuthor[],
): Promise<PostWithAuthor[]> {
  const ids = rows.map((post) => post.id).filter((id): id is string => !!id)
  if (!ids.length) {
    return rows.map((post) => ({
      ...post,
      issue_ids: post.issue_ids || [],
      issues: post.issues || [],
    }))
  }

  try {
    const { data, error } = await supabase
      .from('post_issues')
      .select('post_id, issue_id, issues(id, name)')
      .in('post_id', ids)

    if (error) throw error

    const idsByPost = new Map<string, string[]>()
    const tagsByPost = new Map<string, PostIssueTag[]>()
    for (const row of (data || []) as IssueJoinRow[]) {
      const ids = idsByPost.get(row.post_id) || []
      ids.push(row.issue_id)
      idsByPost.set(row.post_id, ids)

      const issue = issueFromJoin(row.issues)
      if (!issue) continue
      const tags = tagsByPost.get(row.post_id) || []
      tags.push(issue)
      tagsByPost.set(row.post_id, tags)
    }

    return rows.map((post) => {
      const issueIds = post.id ? (idsByPost.get(post.id) || []) : []
      const issues = post.id ? (tagsByPost.get(post.id) || []) : []
      return {
        ...post,
        issues,
        issue_ids: issueIds,
      }
    })
  } catch (e) {
    console.error('Erro ao carregar issues dos posts:', e)
    return rows.map((post) => ({
      ...post,
      issue_ids: post.issue_ids || [],
      issues: post.issues || [],
    }))
  }
}
