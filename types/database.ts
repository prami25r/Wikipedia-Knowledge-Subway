export type Database = {
  public: {
    Tables: {
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
  };
};
