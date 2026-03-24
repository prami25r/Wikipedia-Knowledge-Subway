import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient;

type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type LinkInsert = Database["public"]["Tables"]["links"]["Insert"];
type LinkRow = Database["public"]["Tables"]["links"]["Row"];

export type ArticleRecord = ArticleInsert;
export type LinkRecord = LinkInsert;

export type GraphDataResponse = {
  articles: ArticleRow[];
  links: LinkRow[];
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

export async function insertArticles(
  articles: ArticleRecord[],
  client: DbClient = getSupabaseClient(),
  batchSize = 500,
): Promise<ArticleRow[]> {
  if (articles.length === 0) {
    return [];
  }

  const inserted: ArticleRow[] = [];

  for (const batch of chunkArray(articles, batchSize)) {
    const { data, error } = await client
      .from("articles")
      .upsert(batch, { onConflict: "title" })
      .select();

    if (error) {
      throw new Error(`Failed to insert articles: ${error.message}`);
    }

    inserted.push(...(data ?? []));
  }

  return inserted;
}

export async function insertEdges(
  links: LinkRecord[],
  client: DbClient = getSupabaseClient(),
  batchSize = 1000,
): Promise<LinkRow[]> {
  if (links.length === 0) {
    return [];
  }

  const inserted: LinkRow[] = [];

  for (const batch of chunkArray(links, batchSize)) {
    const { data, error } = await client
      .from("links")
      .upsert(batch, { onConflict: "source,target" })
      .select();

    if (error) {
      throw new Error(`Failed to insert links: ${error.message}`);
    }

    inserted.push(...(data ?? []));
  }

  return inserted;
}

export async function getGraphData(client: DbClient = getSupabaseClient()): Promise<GraphDataResponse> {
  const [{ data: articles, error: articleError }, { data: links, error: linkError }] = await Promise.all([
    client.from("articles").select("id,title,summary,cluster,x,y,degree,created_at,updated_at"),
    client.from("links").select("id,source,target,created_at"),
  ]);

  if (articleError) {
    throw new Error(`Failed to query articles: ${articleError.message}`);
  }

  if (linkError) {
    throw new Error(`Failed to query links: ${linkError.message}`);
  }

  return {
    articles: articles ?? [],
    links: links ?? [],
  };
}
