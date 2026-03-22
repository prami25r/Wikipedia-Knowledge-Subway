export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          summary: string;
          cluster: string | null;
          x: number;
          y: number;
          degree: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary?: string;
          cluster?: string | null;
          x?: number;
          y?: number;
          degree?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          title: string;
          summary: string;
          cluster: string | null;
          x: number;
          y: number;
          degree: number;
          created_at: string;
          updated_at: string;
        }>;
      };
      links: {
        Row: {
          id: string;
          source: string;
          target: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          target: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          source: string;
          target: string;
          created_at: string;
        }>;
      };
      wikipedia_edges: {
        Row: {
          id: string;
          source: string;
          target: string;
          source_label: string;
          target_label: string;
        };
        Insert: {
          id?: string;
          source: string;
          target: string;
          source_label: string;
          target_label: string;
        };
        Update: Partial<{
          id: string;
          source: string;
          target: string;
          source_label: string;
          target_label: string;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
