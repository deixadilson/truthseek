import type { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type PostWithAuthor = Database['public']['Views']['posts_with_author_info']['Row'];
export type CommentWithAuthor = Database['public']['Views']['comments_with_author_info']['Row'];