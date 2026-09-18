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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chronicle_entries: {
        Row: {
          ai_caption: string | null
          ai_status: string
          captured_at: string
          captured_by: string
          created_at: string
          elevation_m: number | null
          entry_type: string
          id: string
          journey_id: string
          journey_quest_id: string | null
          location: unknown
          location_name: string | null
          storage_path: string
          updated_at: string
          vitals_snapshot: Json
          xp_awarded: number
        }
        Insert: {
          ai_caption?: string | null
          ai_status?: string
          captured_at: string
          captured_by: string
          created_at?: string
          elevation_m?: number | null
          entry_type: string
          id?: string
          journey_id: string
          journey_quest_id?: string | null
          location?: unknown
          location_name?: string | null
          storage_path: string
          updated_at?: string
          vitals_snapshot?: Json
          xp_awarded?: number
        }
        Update: {
          ai_caption?: string | null
          ai_status?: string
          captured_at?: string
          captured_by?: string
          created_at?: string
          elevation_m?: number | null
          entry_type?: string
          id?: string
          journey_id?: string
          journey_quest_id?: string | null
          location?: unknown
          location_name?: string | null
          storage_path?: string
          updated_at?: string
          vitals_snapshot?: Json
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "chronicle_entries_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chronicle_entries_quest_journey_fkey"
            columns: ["journey_quest_id", "journey_id"]
            isOneToOne: false
            referencedRelation: "journey_quests"
            referencedColumns: ["id", "journey_id"]
          },
        ]
      }
      journey_events: {
        Row: {
          actor_user_id: string | null
          client_event_id: string
          created_at: string
          event_type: string
          id: number
          journey_id: string
          occurred_at: string
          payload: Json
        }
        Insert: {
          actor_user_id?: string | null
          client_event_id: string
          created_at?: string
          event_type: string
          id?: never
          journey_id: string
          occurred_at: string
          payload?: Json
        }
        Update: {
          actor_user_id?: string | null
          client_event_id?: string
          created_at?: string
          event_type?: string
          id?: never
          journey_id?: string
          occurred_at?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "journey_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_member_stats: {
        Row: {
          journey_id: string
          navigator_distance_m: number
          navigator_seconds: number
          pilot_distance_m: number
          pilot_seconds: number
          position_segments: number
          updated_at: string
          user_id: string
        }
        Insert: {
          journey_id: string
          navigator_distance_m?: number
          navigator_seconds?: number
          pilot_distance_m?: number
          pilot_seconds?: number
          position_segments?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          journey_id?: string
          navigator_distance_m?: number
          navigator_seconds?: number
          pilot_distance_m?: number
          pilot_seconds?: number
          position_segments?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_member_stats_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_quests: {
        Row: {
          accepted_at: string | null
          added_detour_mins: number
          category_snapshot: string
          completed_at: string | null
          flavor_snapshot: string | null
          id: string
          journey_id: string
          location_snapshot: unknown
          objective_snapshot: string | null
          offered_at: string
          quest_place_id: string | null
          rank: number
          rating_snapshot: number | null
          review_count_snapshot: number | null
          score: number
          scoring_version: string
          skipped_at: string | null
          state: string
          title_snapshot: string
          xp_reward: number
        }
        Insert: {
          accepted_at?: string | null
          added_detour_mins: number
          category_snapshot: string
          completed_at?: string | null
          flavor_snapshot?: string | null
          id?: string
          journey_id: string
          location_snapshot: unknown
          objective_snapshot?: string | null
          offered_at?: string
          quest_place_id?: string | null
          rank: number
          rating_snapshot?: number | null
          review_count_snapshot?: number | null
          score: number
          scoring_version?: string
          skipped_at?: string | null
          state?: string
          title_snapshot: string
          xp_reward?: number
        }
        Update: {
          accepted_at?: string | null
          added_detour_mins?: number
          category_snapshot?: string
          completed_at?: string | null
          flavor_snapshot?: string | null
          id?: string
          journey_id?: string
          location_snapshot?: unknown
          objective_snapshot?: string | null
          offered_at?: string
          quest_place_id?: string | null
          rank?: number
          rating_snapshot?: number | null
          review_count_snapshot?: number | null
          score?: number
          scoring_version?: string
          skipped_at?: string | null
          state?: string
          title_snapshot?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "journey_quests_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_quests_quest_place_id_fkey"
            columns: ["quest_place_id"]
            isOneToOne: false
            referencedRelation: "quest_places"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_state: {
        Row: {
          continuous_motion_started_at: string | null
          current_position: unknown
          current_speed_kph: number | null
          detour_spent_mins: number
          fuel_level: number
          journey_id: string
          last_position_at: string | null
          last_rest_at: string | null
          rations: number
          stamina: number
          total_xp: number
          updated_at: string
          version: number
          well_rested_until: string | null
        }
        Insert: {
          continuous_motion_started_at?: string | null
          current_position?: unknown
          current_speed_kph?: number | null
          detour_spent_mins?: number
          fuel_level?: number
          journey_id: string
          last_position_at?: string | null
          last_rest_at?: string | null
          rations?: number
          stamina?: number
          total_xp?: number
          updated_at?: string
          version?: number
          well_rested_until?: string | null
        }
        Update: {
          continuous_motion_started_at?: string | null
          current_position?: unknown
          current_speed_kph?: number | null
          detour_spent_mins?: number
          fuel_level?: number
          journey_id?: string
          last_position_at?: string | null
          last_rest_at?: string | null
          rations?: number
          stamina?: number
          total_xp?: number
          updated_at?: string
          version?: number
          well_rested_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_state_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: true
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          baseline_distance_m: number | null
          baseline_duration_mins: number | null
          completed_at: string | null
          created_at: string
          created_by: string
          destination_location: unknown
          destination_name: string
          detour_budget_mins: number
          estimated_range_km: number | null
          fuel_mode: string
          id: string
          origin_location: unknown
          origin_name: string
          party_id: string
          route_polyline: string | null
          route_provider: string | null
          route_provider_id: string | null
          started_at: string | null
          status: string
          target_quest_count: number
          updated_at: string
          vibe_preferences: string[]
        }
        Insert: {
          baseline_distance_m?: number | null
          baseline_duration_mins?: number | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          destination_location?: unknown
          destination_name: string
          detour_budget_mins?: number
          estimated_range_km?: number | null
          fuel_mode?: string
          id?: string
          origin_location?: unknown
          origin_name: string
          party_id: string
          route_polyline?: string | null
          route_provider?: string | null
          route_provider_id?: string | null
          started_at?: string | null
          status?: string
          target_quest_count?: number
          updated_at?: string
          vibe_preferences?: string[]
        }
        Update: {
          baseline_distance_m?: number | null
          baseline_duration_mins?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          destination_location?: unknown
          destination_name?: string
          detour_budget_mins?: number
          estimated_range_km?: number | null
          fuel_mode?: string
          id?: string
          origin_location?: unknown
          origin_name?: string
          party_id?: string
          route_polyline?: string | null
          route_provider?: string | null
          route_provider_id?: string | null
          started_at?: string | null
          status?: string
          target_quest_count?: number
          updated_at?: string
          vibe_preferences?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "journeys_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      party_invites: {
        Row: {
          code_digest: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          intended_role: string
          party_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          revoked_at: string | null
        }
        Insert: {
          code_digest: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          intended_role?: string
          party_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
        }
        Update: {
          code_digest?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          intended_role?: string
          party_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "party_invites_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      party_members: {
        Row: {
          display_name: string
          joined_at: string
          left_at: string | null
          party_id: string
          role: string
          user_id: string
        }
        Insert: {
          display_name: string
          joined_at?: string
          left_at?: string | null
          party_id: string
          role: string
          user_id: string
        }
        Update: {
          display_name?: string
          joined_at?: string
          left_at?: string | null
          party_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_seed: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_seed?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_seed?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quest_places: {
        Row: {
          address: string | null
          category: string
          created_at: string
          flavor_dialog: string | null
          id: string
          is_active: boolean
          location: unknown
          name: string
          objective_prompt: string | null
          provider: string
          provider_payload: Json
          provider_place_id: string
          rating: number | null
          refreshed_at: string
          review_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          flavor_dialog?: string | null
          id?: string
          is_active?: boolean
          location: unknown
          name: string
          objective_prompt?: string | null
          provider: string
          provider_payload?: Json
          provider_place_id: string
          rating?: number | null
          refreshed_at?: string
          review_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          flavor_dialog?: string | null
          id?: string
          is_active?: boolean
          location?: unknown
          name?: string
          objective_prompt?: string | null
          provider?: string
          provider_payload?: Json
          provider_place_id?: string
          rating?: number | null
          refreshed_at?: string
          review_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      traveler_role_totals: {
        Row: {
          journeys_count: number | null
          navigator_distance_m: number | null
          navigator_seconds: number | null
          pilot_distance_m: number | null
          pilot_seconds: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      trip_planner: { Args: { p_action: string; p_data?: Json }; Returns: Json }
      create_photo_upload: {
        Args: {
          p_captured_at?: string
          p_elevation_m?: number
          p_entry_type: string
          p_file_extension?: string
          p_journey_id: string
          p_journey_quest_id?: string
          p_latitude?: number
          p_location_name?: string
          p_longitude?: number
          p_vitals_snapshot?: Json
        }
        Returns: Json
      }
      create_trip: {
        Args: {
          p_destination_name: string
          p_detour_budget_mins?: number
          p_fuel_mode?: string
          p_origin_name: string
          p_party_name: string
          p_target_quest_count?: number
          p_vibe_preferences?: string[]
        }
        Returns: Json
      }
      finalize_photo_upload: { Args: { p_entry_id: string }; Returns: Json }
      join_trip: {
        Args: { p_display_name?: string; p_invite_code: string }
        Returns: Json
      }
      record_journey_event: {
        Args: {
          p_client_event_id: string
          p_event_type: string
          p_journey_id: string
          p_occurred_at?: string
          p_payload?: Json
        }
        Returns: Json
      }
      set_quest_state: {
        Args: {
          p_client_event_id?: string
          p_journey_quest_id: string
          p_next_state: string
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
