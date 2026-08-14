export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      biases: {
        Row: {
          created_at: string
          endorsement_power: number
          group_id: string
          id: string
          influence_points: number
          level: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endorsement_power?: number
          group_id: string
          id?: string
          influence_points?: number
          level?: number
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endorsement_power?: number
          group_id?: string
          id?: string
          influence_points?: number
          level?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "biases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          created_at: string
          deleted_at: string | null
          dislikes_count: number
          id: string
          image_path: string | null
          is_anonymous: boolean
          is_edited: boolean
          is_moderated: boolean
          likes_count: number
          post_id: string
          reply_to: string | null
          report_points: number
          text_content: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          deleted_at?: string | null
          dislikes_count?: number
          id?: string
          image_path?: string | null
          is_anonymous?: boolean
          is_edited?: boolean
          is_moderated?: boolean
          likes_count?: number
          post_id: string
          reply_to?: string | null
          report_points?: number
          text_content?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string
          deleted_at?: string | null
          dislikes_count?: number
          id?: string
          image_path?: string | null
          is_anonymous?: boolean
          is_edited?: boolean
          is_moderated?: boolean
          likes_count?: number
          post_id?: string
          reply_to?: string | null
          report_points?: number
          text_content?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_author_info"
            referencedColumns: ["id"]
          },
        ]
      }
      content_revisions: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          is_anonymous: boolean
          is_moderated: boolean
          target_id: string
          target_type: string
          text_content: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_anonymous?: boolean
          is_moderated?: boolean
          target_id: string
          target_type: string
          text_content?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_anonymous?: boolean
          is_moderated?: boolean
          target_id?: string
          target_type?: string
          text_content?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          Name: string
        }
        Insert: {
          code: string
          created_at?: string
          Name: string
        }
        Update: {
          code?: string
          created_at?: string
          Name?: string
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          author_id: string
          bias_id: string
          created_at: string
          endorsement_type: number
          id: string
          points_awarded: number
        }
        Insert: {
          author_id: string
          bias_id: string
          created_at?: string
          endorsement_type: number
          id?: string
          points_awarded?: number
        }
        Update: {
          author_id?: string
          bias_id?: string
          created_at?: string
          endorsement_type?: number
          id?: string
          points_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "endorsements_bias_id_fkey"
            columns: ["bias_id"]
            isOneToOne: false
            referencedRelation: "biases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsements_bias_id_fkey"
            columns: ["bias_id"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_requests: {
        Row: {
          created_at: string
          requester_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          requester_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          requester_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      group_oppositions: {
        Row: {
          group_id_a: string
          group_id_b: string
        }
        Insert: {
          group_id_a: string
          group_id_b: string
        }
        Update: {
          group_id_a?: string
          group_id_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_oppositions_group_id_a_fkey"
            columns: ["group_id_a"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "group_oppositions_group_id_a_fkey"
            columns: ["group_id_a"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_oppositions_group_id_b_fkey"
            columns: ["group_id_b"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "group_oppositions_group_id_b_fkey"
            columns: ["group_id_b"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category_group_id: string | null
          country_code: string
          cover_image_path: string | null
          created_at: string
          description: string | null
          flag_path: string | null
          has_subgroups: boolean
          hidden: boolean
          id: string
          is_open: boolean
          level: number
          name: string
          parent_group_id: string | null
          slug: string
          taxon_id: string
        }
        Insert: {
          category_group_id?: string | null
          country_code: string
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          flag_path?: string | null
          has_subgroups?: boolean
          hidden?: boolean
          id?: string
          is_open?: boolean
          level?: number
          name: string
          parent_group_id?: string | null
          slug: string
          taxon_id: string
        }
        Update: {
          category_group_id?: string | null
          country_code?: string
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          flag_path?: string | null
          has_subgroups?: boolean
          hidden?: boolean
          id?: string
          is_open?: boolean
          level?: number
          name?: string
          parent_group_id?: string | null
          slug?: string
          taxon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_category_group_id_fkey"
            columns: ["category_group_id"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "groups_category_group_id_fkey"
            columns: ["category_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "groups_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "groups_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_taxon_id_fkey"
            columns: ["taxon_id"]
            isOneToOne: false
            referencedRelation: "taxons"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          created_at: string
          description: string | null
          group_id: string
          id: string
          name: string
          parent_issue_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          name: string
          parent_issue_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          name?: string
          parent_issue_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "issues_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "issues_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_parent_issue_id_fkey"
            columns: ["parent_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          post_id: string | null
          read_at: string | null
          target_id: string
          target_type: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          target_id: string
          target_type: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          target_id?: string
          target_type?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_issues: {
        Row: {
          created_at: string
          issue_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          issue_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          issue_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_issues_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_issues_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_author_info"
            referencedColumns: ["id"]
          },
        ]
      }
      post_subscriptions: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_subscriptions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_subscriptions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_author_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          comments_count: number
          created_at: string
          deleted_at: string | null
          dislikes_count: number
          id: string
          image_path: string | null
          is_anonymous: boolean
          is_edited: boolean
          is_moderated: boolean
          likes_count: number
          owner_id: string
          owner_type: string
          report_points: number
          text_content: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          comments_count?: number
          created_at?: string
          deleted_at?: string | null
          dislikes_count?: number
          id?: string
          image_path?: string | null
          is_anonymous?: boolean
          is_edited?: boolean
          is_moderated?: boolean
          likes_count?: number
          owner_id: string
          owner_type: string
          report_points?: number
          text_content?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          comments_count?: number
          created_at?: string
          deleted_at?: string | null
          dislikes_count?: number
          id?: string
          image_path?: string | null
          is_anonymous?: boolean
          is_edited?: boolean
          is_moderated?: boolean
          likes_count?: number
          owner_id?: string
          owner_type?: string
          report_points?: number
          text_content?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      premise_oppositions: {
        Row: {
          created_at: string
          premise_id_a: string
          premise_id_b: string
        }
        Insert: {
          created_at?: string
          premise_id_a: string
          premise_id_b: string
        }
        Update: {
          created_at?: string
          premise_id_a?: string
          premise_id_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "premise_oppositions_premise_id_a_fkey"
            columns: ["premise_id_a"]
            isOneToOne: false
            referencedRelation: "premises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premise_oppositions_premise_id_b_fkey"
            columns: ["premise_id_b"]
            isOneToOne: false
            referencedRelation: "premises"
            referencedColumns: ["id"]
          },
        ]
      }
      premises: {
        Row: {
          axis_key: string | null
          created_at: string
          description: string
          group_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          axis_key?: string | null
          created_at?: string
          description: string
          group_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          axis_key?: string | null
          created_at?: string
          description?: string
          group_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "premises_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "premises_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_accept_follow_requests: boolean
          avatar_path: string | null
          birth_date: string
          country_code: string | null
          created_at: string
          default_moderated_posts: boolean
          email_notify_comment: boolean
          email_notify_endorse: boolean
          email_notify_like: boolean
          email_notify_reply: boolean
          gender: string
          id: string
          profile_visibility: string
          updated_at: string | null
          username: string
        }
        Insert: {
          auto_accept_follow_requests?: boolean
          avatar_path?: string | null
          birth_date: string
          country_code?: string | null
          created_at?: string
          default_moderated_posts?: boolean
          email_notify_comment?: boolean
          email_notify_endorse?: boolean
          email_notify_like?: boolean
          email_notify_reply?: boolean
          gender: string
          id?: string
          profile_visibility?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          auto_accept_follow_requests?: boolean
          avatar_path?: string | null
          birth_date?: string
          country_code?: string | null
          created_at?: string
          default_moderated_posts?: boolean
          email_notify_comment?: boolean
          email_notify_endorse?: boolean
          email_notify_like?: boolean
          email_notify_reply?: boolean
          gender?: string
          id?: string
          profile_visibility?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points: number
          report_type: string
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          report_type: string
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          report_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      taxons: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          level: number
          name: string
          parent_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          level: number
          name: string
          parent_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          level?: number
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taxons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "taxons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "taxons"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
          vote_type: number
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
          vote_type: number
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: []
      }
    }
    Views: {
      biases_with_details: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string | null
          group_country_code: string | null
          group_flag_path: string | null
          group_id: string | null
          group_name: string | null
          group_slug: string | null
          id: string | null
          influence_points: number | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "biases_with_details"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "biases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_country_code_fkey"
            columns: ["group_country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      comments_with_author_info: {
        Row: {
          author_avatar_path: string | null
          author_id: string | null
          author_username: string | null
          created_at: string | null
          dislikes_count: number | null
          id: string | null
          image_path: string | null
          is_anonymous: boolean | null
          is_edited: boolean | null
          is_moderated: boolean | null
          likes_count: number | null
          post_id: string | null
          reply_to: string | null
          report_points: number | null
          text_content: string | null
          updated_at: string | null
          video_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_author_info"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_with_actor: {
        Row: {
          actor_avatar_path: string | null
          actor_id: string | null
          actor_username: string | null
          created_at: string | null
          id: string | null
          post_id: string | null
          read_at: string | null
          target_id: string | null
          target_type: string | null
          type: string | null
          user_id: string | null
        }
        Relationships: []
      }
      posts_with_author_info: {
        Row: {
          author_avatar_path: string | null
          author_id: string | null
          author_username: string | null
          comments_count: number | null
          created_at: string | null
          dislikes_count: number | null
          id: string | null
          image_path: string | null
          is_anonymous: boolean | null
          is_edited: boolean | null
          is_moderated: boolean | null
          likes_count: number | null
          owner_group_country_code: string | null
          owner_group_name: string | null
          owner_group_slug: string | null
          owner_id: string | null
          owner_type: string | null
          report_points: number | null
          text_content: string | null
          updated_at: string | null
          video_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_country_code_fkey"
            columns: ["owner_group_country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      accept_follow_request: {
        Args: { p_requester_id: string }
        Returns: undefined
      }
      block_user: { Args: { p_blocked_id: string }; Returns: boolean }
      blocked_pair_ids: { Args: never; Returns: string[] }
      can_declare_bias: {
        Args: { p_group_id_to_declare: string; p_user_id: string }
        Returns: {
          can_declare: boolean
          reason: string
        }[]
      }
      cancel_follow_request: {
        Args: { p_target_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_actor_id: string
          p_post_id?: string
          p_target_id: string
          p_target_type: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_report: {
        Args: {
          p_description?: string
          p_report_type: string
          p_target_id: string
          p_target_type: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          points: number
          report_type: string
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
        }
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      edit_comment: {
        Args: {
          p_comment_id: string
          p_image_path?: string
          p_text_content: string
          p_video_url?: string
        }
        Returns: {
          author_id: string | null
          created_at: string
          deleted_at: string | null
          dislikes_count: number
          id: string
          image_path: string | null
          is_anonymous: boolean
          is_edited: boolean
          is_moderated: boolean
          likes_count: number
          post_id: string
          reply_to: string | null
          report_points: number
          text_content: string | null
          updated_at: string
          video_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "comments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      edit_post: {
        Args: {
          p_image_path?: string
          p_post_id: string
          p_text_content: string
          p_video_url?: string
        }
        Returns: {
          author_id: string | null
          comments_count: number
          created_at: string
          deleted_at: string | null
          dislikes_count: number
          id: string
          image_path: string | null
          is_anonymous: boolean
          is_edited: boolean
          is_moderated: boolean
          likes_count: number
          owner_id: string
          owner_type: string
          report_points: number
          text_content: string | null
          updated_at: string
          video_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_block_status: { Args: { p_other_id: string }; Returns: string }
      get_follow_counts: {
        Args: { p_user_id: string }
        Returns: {
          followers_count: number
          following_count: number
        }[]
      }
      get_follow_status: { Args: { p_other_id: string }; Returns: string }
      get_issues_for_group: {
        Args: { p_group_id: string }
        Returns: {
          created_at: string
          description: string | null
          group_id: string
          id: string
          name: string
          parent_issue_id: string | null
          slug: string
          sort_order: number
        }[]
        SetofOptions: {
          from: "*"
          to: "issues"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_timeline_posts: {
        Args: { p_before?: string; p_limit?: number }
        Returns: {
          author_avatar_path: string | null
          author_id: string | null
          author_username: string | null
          comments_count: number | null
          created_at: string | null
          dislikes_count: number | null
          id: string | null
          image_path: string | null
          is_anonymous: boolean | null
          is_edited: boolean | null
          is_moderated: boolean | null
          likes_count: number | null
          owner_group_country_code: string | null
          owner_group_name: string | null
          owner_group_slug: string | null
          owner_id: string | null
          owner_type: string | null
          report_points: number | null
          text_content: string | null
          updated_at: string | null
          video_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "posts_with_author_info"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_biases_for_category: {
        Args: {
          p_author_id: string
          p_context_group_id: string
          p_current_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["user_bias_for_popover"][]
        SetofOptions: {
          from: "*"
          to: "user_bias_for_popover"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      handle_endorsement: {
        Args: {
          p_bias_id: string
          p_endorsement_type: number
          p_endorsing_user_id: string
          p_points_to_award?: number
        }
        Returns: {
          message: string
          new_influence_points: number
          success: boolean
        }[]
      }
      issue_is_available_for_group: {
        Args: { p_issue_group_id: string; p_target_group_id: string }
        Returns: boolean
      }
      list_followers: {
        Args: { p_before?: string; p_limit?: number; p_user_id: string }
        Returns: {
          avatar_path: string
          follow_status: string
          followed_at: string
          id: string
          username: string
        }[]
      }
      list_following: {
        Args: { p_before?: string; p_limit?: number; p_user_id: string }
        Returns: {
          avatar_path: string
          follow_status: string
          followed_at: string
          id: string
          username: string
        }[]
      }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[] }
        Returns: number
      }
      reject_follow_request: {
        Args: { p_requester_id: string }
        Returns: undefined
      }
      request_follow: { Args: { p_target_id: string }; Returns: string }
      soft_delete_comment: { Args: { p_comment_id: string }; Returns: boolean }
      soft_delete_post: { Args: { p_post_id: string }; Returns: boolean }
      unblock_user: { Args: { p_blocked_id: string }; Returns: boolean }
      users_are_blocked: {
        Args: { p_a: string; p_b: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      user_bias_for_popover: {
        bias_id: string | null
        group_id: string | null
        group_name: string | null
        group_slug: string | null
        flag_path: string | null
        country_code: string | null
        influence_points: number | null
        title: string | null
        current_user_endorsement: number | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
