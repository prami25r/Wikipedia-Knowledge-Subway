import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StationMetadata } from "../types/graph.js";
import { normalizeNodeId } from "../utils/id.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LocalArticle {
  id: string;
  url?: string;
  line?: string;
}

interface LocalArticlesFile {
  nodes?: LocalArticle[];
}

export class MetadataService {
  private readonly localMap = new Map<string, StationMetadata>();
  private readonly supabase?: SupabaseClient;

  constructor() {
    this.loadLocalData();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
    }
  }

  private loadLocalData(): void {
    const filePath = path.resolve(__dirname, "../../data/articles.json");
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as LocalArticlesFile;

    for (const article of parsed.nodes ?? []) {
      this.localMap.set(normalizeNodeId(article.id), {
        id: normalizeNodeId(article.id),
        title: article.id,
        summary: "",
        categories: article.line ? [article.line] : [],
        wikipedia_url:
          article.url?.replaceAll("\\_", "_") ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(article.id)}`,
      });
    }
  }

  async getStationMetadata(id: string): Promise<StationMetadata> {
    const normalizedId = normalizeNodeId(id);

    if (this.supabase) {
      const { data } = await this.supabase
        .from("wikipedia_articles")
        .select("id,title,summary,categories,wikipedia_url")
        .eq("id", normalizedId)
        .maybeSingle();

      if (data) {
        return {
          id: normalizeNodeId(data.id),
          title: data.title,
          summary: data.summary ?? "",
          categories: data.categories ?? [],
          wikipedia_url: data.wikipedia_url,
        };
      }
    }

    return (
      this.localMap.get(normalizedId) ?? {
        id: normalizedId,
        title: id,
        summary: "",
        categories: [],
        wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(id)}`,
      }
    );
  }
}
