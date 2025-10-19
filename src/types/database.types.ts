export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_budget: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          current_usage: number | null
          daily_limit: number
          date: string
          estimated_cost: number | null
          id: string
          last_updated: string | null
          quota_type: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          current_usage?: number | null
          daily_limit: number
          date?: string
          estimated_cost?: number | null
          id?: string
          last_updated?: string | null
          quota_type: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          current_usage?: number | null
          daily_limit?: number
          date?: string
          estimated_cost?: number | null
          id?: string
          last_updated?: string | null
          quota_type?: string
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          channel_id: string | null
          cost_usd: number | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          method: string | null
          quota_cost: number | null
          quota_type: string
          request_params: Json | null
          response_status: number | null
          user_agent: string | null
          video_id: string | null
        }
        Insert: {
          channel_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method?: string | null
          quota_cost?: number | null
          quota_type: string
          request_params?: Json | null
          response_status?: number | null
          user_agent?: string | null
          video_id?: string | null
        }
        Update: {
          channel_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method?: string | null
          quota_cost?: number | null
          quota_type?: string
          request_params?: Json | null
          response_status?: number | null
          user_agent?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_log_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_log_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_log_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorization_rules: {
        Row: {
          active: boolean | null
          category_id: string | null
          conditions: Json
          created_at: string | null
          id: string
          name: string
          priority: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          conditions: Json
          created_at?: string | null
          id?: string
          name: string
          priority: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          conditions?: Json
          created_at?: string | null
          id?: string
          name?: string
          priority?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_feeds: {
        Row: {
          channel_id: string
          consecutive_failures: number | null
          created_at: string | null
          etag: string | null
          feed_metadata: Json | null
          feed_type: string | null
          feed_url: string
          id: string
          is_active: boolean | null
          last_error_at: string | null
          last_error_message: string | null
          last_modified: string | null
          last_polled_at: string | null
          last_successful_poll_at: string | null
          poll_interval_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          consecutive_failures?: number | null
          created_at?: string | null
          etag?: string | null
          feed_metadata?: Json | null
          feed_type?: string | null
          feed_url: string
          id?: string
          is_active?: boolean | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_modified?: string | null
          last_polled_at?: string | null
          last_successful_poll_at?: string | null
          poll_interval_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          consecutive_failures?: number | null
          created_at?: string | null
          etag?: string | null
          feed_metadata?: Json | null
          feed_type?: string | null
          feed_url?: string
          id?: string
          is_active?: boolean | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_modified?: string | null
          last_polled_at?: string | null
          last_successful_poll_at?: string | null
          poll_interval_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_feeds_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_feeds_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_stats: {
        Row: {
          average_view_duration: unknown | null
          channel_id: string
          created_at: string | null
          date: string
          estimated_minutes_watched: number | null
          id: string
          subscriber_count: number | null
          subscriber_gained: number | null
          subscriber_lost: number | null
          video_count: number | null
          view_count: number | null
          view_gained: number | null
        }
        Insert: {
          average_view_duration?: unknown | null
          channel_id: string
          created_at?: string | null
          date: string
          estimated_minutes_watched?: number | null
          id?: string
          subscriber_count?: number | null
          subscriber_gained?: number | null
          subscriber_lost?: number | null
          video_count?: number | null
          view_count?: number | null
          view_gained?: number | null
        }
        Update: {
          average_view_duration?: unknown | null
          channel_id?: string
          created_at?: string | null
          date?: string
          estimated_minutes_watched?: number | null
          id?: string
          subscriber_count?: number | null
          subscriber_gained?: number | null
          subscriber_lost?: number | null
          video_count?: number | null
          view_count?: number | null
          view_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_stats_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_stats_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          branding_settings: Json | null
          country: string | null
          created_at: string | null
          custom_url: string | null
          default_language: string | null
          description: string | null
          featured_channels: string[] | null
          id: string
          is_linked: boolean | null
          keywords: string[] | null
          last_fetched_at: string | null
          long_uploads_status: string | null
          made_for_kids: boolean | null
          privacy_status: string | null
          published_at: string
          slug: string
          status: string | null
          subscriber_count: number | null
          thumbnail_url: string | null
          title: string
          topic_categories: Json | null
          updated_at: string | null
          video_count: number | null
          view_count: number | null
          youtube_channel_id: string
        }
        Insert: {
          branding_settings?: Json | null
          country?: string | null
          created_at?: string | null
          custom_url?: string | null
          default_language?: string | null
          description?: string | null
          featured_channels?: string[] | null
          id?: string
          is_linked?: boolean | null
          keywords?: string[] | null
          last_fetched_at?: string | null
          long_uploads_status?: string | null
          made_for_kids?: boolean | null
          privacy_status?: string | null
          published_at: string
          slug: string
          status?: string | null
          subscriber_count?: number | null
          thumbnail_url?: string | null
          title: string
          topic_categories?: Json | null
          updated_at?: string | null
          video_count?: number | null
          view_count?: number | null
          youtube_channel_id: string
        }
        Update: {
          branding_settings?: Json | null
          country?: string | null
          created_at?: string | null
          custom_url?: string | null
          default_language?: string | null
          description?: string | null
          featured_channels?: string[] | null
          id?: string
          is_linked?: boolean | null
          keywords?: string[] | null
          last_fetched_at?: string | null
          long_uploads_status?: string | null
          made_for_kids?: boolean | null
          privacy_status?: string | null
          published_at?: string
          slug?: string
          status?: string | null
          subscriber_count?: number | null
          thumbnail_url?: string | null
          title?: string
          topic_categories?: Json | null
          updated_at?: string | null
          video_count?: number | null
          view_count?: number | null
          youtube_channel_id?: string
        }
        Relationships: []
      }
      job_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          job_id: string
          worker_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          job_id: string
          worker_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          job_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          dedup_key: string | null
          error_count: number | null
          failed_at: string | null
          id: string
          job_type: string
          last_error: string | null
          locked_by: string | null
          locked_until: string | null
          max_attempts: number | null
          payload: Json
          priority: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          dedup_key?: string | null
          error_count?: number | null
          failed_at?: string | null
          id?: string
          job_type: string
          last_error?: string | null
          locked_by?: string | null
          locked_until?: string | null
          max_attempts?: number | null
          payload: Json
          priority?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          dedup_key?: string | null
          error_count?: number | null
          failed_at?: string | null
          id?: string
          job_type?: string
          last_error?: string | null
          locked_by?: string | null
          locked_until?: string | null
          max_attempts?: number | null
          payload?: Json
          priority?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          key: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      video_stats: {
        Row: {
          average_view_duration: unknown | null
          comment_count: number | null
          created_at: string | null
          date: string
          estimated_minutes_watched: number | null
          hour: number | null
          id: string
          like_count: number | null
          share_count: number | null
          subscriber_gained: number | null
          video_id: string
          view_count: number | null
          view_gained: number | null
        }
        Insert: {
          average_view_duration?: unknown | null
          comment_count?: number | null
          created_at?: string | null
          date: string
          estimated_minutes_watched?: number | null
          hour?: number | null
          id?: string
          like_count?: number | null
          share_count?: number | null
          subscriber_gained?: number | null
          video_id: string
          view_count?: number | null
          view_gained?: number | null
        }
        Update: {
          average_view_duration?: unknown | null
          comment_count?: number | null
          created_at?: string | null
          date?: string
          estimated_minutes_watched?: number | null
          hour?: number | null
          id?: string
          like_count?: number | null
          share_count?: number | null
          subscriber_gained?: number | null
          video_id?: string
          view_count?: number | null
          view_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_stats_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_stats_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          allowed_regions: string[] | null
          blocked_regions: string[] | null
          caption: boolean | null
          category_id: string | null
          channel_id: string
          comment_count: number | null
          created_at: string | null
          default_audio_language: string | null
          default_language: string | null
          definition: string | null
          description: string | null
          dimension: string | null
          duration: unknown | null
          embeddable: boolean | null
          id: string
          last_fetched_at: string | null
          licensed_content: boolean | null
          like_count: number | null
          live_broadcast_content: string | null
          privacy_status: string | null
          projection: string | null
          published_at: string
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
          youtube_category_id: string | null
          youtube_video_id: string
        }
        Insert: {
          allowed_regions?: string[] | null
          blocked_regions?: string[] | null
          caption?: boolean | null
          category_id?: string | null
          channel_id: string
          comment_count?: number | null
          created_at?: string | null
          default_audio_language?: string | null
          default_language?: string | null
          definition?: string | null
          description?: string | null
          dimension?: string | null
          duration?: unknown | null
          embeddable?: boolean | null
          id?: string
          last_fetched_at?: string | null
          licensed_content?: boolean | null
          like_count?: number | null
          live_broadcast_content?: string | null
          privacy_status?: string | null
          projection?: string | null
          published_at: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          youtube_category_id?: string | null
          youtube_video_id: string
        }
        Update: {
          allowed_regions?: string[] | null
          blocked_regions?: string[] | null
          caption?: boolean | null
          category_id?: string | null
          channel_id?: string
          comment_count?: number | null
          created_at?: string | null
          default_audio_language?: string | null
          default_language?: string | null
          definition?: string | null
          description?: string | null
          dimension?: string | null
          duration?: unknown | null
          embeddable?: boolean | null
          id?: string
          last_fetched_at?: string | null
          licensed_content?: boolean | null
          like_count?: number | null
          live_broadcast_content?: string | null
          privacy_status?: string | null
          projection?: string | null
          published_at?: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          youtube_category_id?: string | null
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_usage_summary: {
        Row: {
          avg_cost: number | null
          endpoint: string | null
          hour: string | null
          max_cost: number | null
          requests: number | null
          total_cost: number | null
          unique_ips: string | null
        }
        Relationships: []
      }
      channel_performance: {
        Row: {
          activity_score: number | null
          avg_views_per_video: number | null
          channel_created_at: string | null
          channel_id: string | null
          channel_updated_at: string | null
          current_subscribers: number | null
          current_videos: number | null
          current_views: number | null
          id: string | null
          last_stats_update: string | null
          recent_video_count_30d: number | null
          subscriber_count: number | null
          subscriber_growth_30d: number | null
          title: string | null
          total_videos: number | null
          total_views: number | null
          video_count: number | null
          view_count: number | null
        }
        Relationships: []
      }
      job_queue_status: {
        Row: {
          avg_processing_time_seconds: number | null
          count: number | null
          last_24h: number | null
          last_hour: number | null
          last_updated: string | null
          oldest_pending: string | null
          status: string | null
        }
        Relationships: []
      }
      video_performance: {
        Row: {
          age_days: number | null
          channel_id: string | null
          channel_title: string | null
          comment_count: number | null
          duration: unknown | null
          engagement_rate_percent: number | null
          id: string | null
          last_stats_update: string | null
          latest_comments: number | null
          latest_likes: number | null
          latest_views: number | null
          like_count: number | null
          performance_score: number | null
          published_at: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      ack_job: {
        Args: { p_job_id: number }
        Returns: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          dedup_key: string | null
          error_count: number | null
          failed_at: string | null
          id: string
          job_type: string
          last_error: string | null
          locked_by: string | null
          locked_until: string | null
          max_attempts: number | null
          payload: Json
          priority: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
      }
      api_quota_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_access_channel: {
        Args: { channel_id_param: string }
        Returns: boolean
      }
      can_access_video: {
        Args: { video_id_param: string }
        Returns: boolean
      }
      capture_channel_stats: {
        Args: { p_channel_id: string; stats_data: Json }
        Returns: {
          is_new_day: boolean
          stats_id: string
        }[]
      }
      capture_video_stats: {
        Args: { video_stats_array: Json[] }
        Returns: {
          daily_change: number
          hourly_change: number
          stats_id: string
          youtube_video_id: string
        }[]
      }
      check_api_quota: {
        Args: { quota_type_param: string; requested_cost?: number }
        Returns: boolean
      }
      cleanup_old_data: {
        Args: { days_to_keep?: number }
        Returns: {
          records_deleted: number
          table_name: string
        }[]
      }
      complete_job: {
        Args: { job_id_param: string }
        Returns: boolean
      }
      dead_letter_job: {
        Args: { p_job_id: number }
        Returns: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          dedup_key: string | null
          error_count: number | null
          failed_at: string | null
          id: string
          job_type: string
          last_error: string | null
          locked_by: string | null
          locked_until: string | null
          max_attempts: number | null
          payload: Json
          priority: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
      }
      dequeue_jobs: {
        Args:
          | {
              job_types_param?: string[]
              limit_param?: number
              lock_duration?: unknown
              worker_id_param: string
            }
          | { p_job_type?: string; p_max_jobs?: number }
        Returns: {
          job_id: string
          job_type: string
          payload: Json
          priority: number
        }[]
      }
      enqueue_job: {
        Args:
          | {
              dedup_key_param?: string
              job_type_param: string
              payload_param: Json
              priority_param?: number
              scheduled_at_param?: string
            }
          | { p_job_payload: Json; p_job_type: string; p_scheduled_at?: string }
        Returns: string
      }
      enqueue_process_queue: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      enqueue_refresh_hot_videos: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      enqueue_scheduled_rss_polls: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      fail_job: {
        Args: { error_message_param?: string; job_id_param: string }
        Returns: string
      }
      generate_channel_slug: {
        Args: { channel_title: string }
        Returns: string
      }
      get_channel_stats_history: {
        Args: { channel_id_param: string; days_back?: number }
        Returns: {
          date: string
          subscriber_count: number
          subscriber_growth: number
          video_count: number
          video_growth: number
          view_count: number
          view_growth: number
        }[]
      }
      get_database_size_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          row_count: number
          size_bytes: number
          size_mb: number
          table_name: string
        }[]
      }
      get_system_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric: string
          status: string
          value: string
        }[]
      }
      get_top_channels: {
        Args: { days_back?: number; limit_param?: number; metric?: string }
        Returns: {
          channel_id: string
          channel_title: string
          metric_value: number
          rank: number
        }[]
      }
      get_top_videos: {
        Args: { days_back?: number; limit_param?: number; metric?: string }
        Returns: {
          channel_title: string
          metric_value: number
          rank: number
          video_id: string
          video_title: string
        }[]
      }
      get_video_stats_history: {
        Args: { days_back?: number; video_id_param: string }
        Returns: {
          comment_count: number
          comment_growth: number
          date: string
          like_count: number
          like_growth: number
          view_count: number
          view_growth: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_api_usage: {
        Args: {
          channel_id_param?: string
          endpoint_param: string
          error_message_param?: string
          method_param?: string
          quota_cost_param?: number
          quota_type_param: string
          response_status_param?: number
          video_id_param?: string
        }
        Returns: undefined
      }
      queue_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      retry_job: {
        Args: { p_job_id: number }
        Returns: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          dedup_key: string | null
          error_count: number | null
          failed_at: string | null
          id: string
          job_type: string
          last_error: string | null
          locked_by: string | null
          locked_until: string | null
          max_attempts: number | null
          payload: Json
          priority: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
      }
      schedule_refresh_channel_stats: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      schedule_refresh_video_stats_weekly: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      secure_complete_job: {
        Args: { job_id_param: string }
        Returns: boolean
      }
      secure_dequeue_jobs: {
        Args: {
          job_types_param?: string[]
          limit_param?: number
          lock_duration?: unknown
          worker_id_param: string
        }
        Returns: {
          job_id: string
          job_type: string
          payload: Json
          priority: number
        }[]
      }
      secure_enqueue_job: {
        Args: {
          dedup_key_param?: string
          job_type_param: string
          payload_param: Json
          priority_param?: number
          scheduled_at_param?: string
        }
        Returns: string
      }
      secure_fail_job: {
        Args: { error_message_param?: string; job_id_param: string }
        Returns: string
      }
      should_poll_feed: {
        Args: { feed_id: string }
        Returns: boolean
      }
      update_api_budget: {
        Args: { quota_cost_param?: number; quota_type_param: string }
        Returns: undefined
      }
      upsert_channel: {
        Args: { channel_data: Json }
        Returns: {
          branding_settings: Json | null
          country: string | null
          created_at: string | null
          custom_url: string | null
          default_language: string | null
          description: string | null
          featured_channels: string[] | null
          id: string
          is_linked: boolean | null
          keywords: string[] | null
          last_fetched_at: string | null
          long_uploads_status: string | null
          made_for_kids: boolean | null
          privacy_status: string | null
          published_at: string
          slug: string
          status: string | null
          subscriber_count: number | null
          thumbnail_url: string | null
          title: string
          topic_categories: Json | null
          updated_at: string | null
          video_count: number | null
          view_count: number | null
          youtube_channel_id: string
        }
      }
      upsert_videos: {
        Args: { video_data: Json }
        Returns: {
          allowed_regions: string[] | null
          blocked_regions: string[] | null
          caption: boolean | null
          category_id: string | null
          channel_id: string
          comment_count: number | null
          created_at: string | null
          default_audio_language: string | null
          default_language: string | null
          definition: string | null
          description: string | null
          dimension: string | null
          duration: unknown | null
          embeddable: boolean | null
          id: string
          last_fetched_at: string | null
          licensed_content: boolean | null
          like_count: number | null
          live_broadcast_content: string | null
          privacy_status: string | null
          projection: string | null
          published_at: string
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
          youtube_category_id: string | null
          youtube_video_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

