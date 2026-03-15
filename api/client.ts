import { KnowledgeGraphDTO } from "@/types/graph";

export type ArticleDetailsDTO = {
  title: string;
  summary: string;
  connections: string[];
  cluster: string | null;
};

export async function fetchKnowledgeGraph(seed = "Wikipedia"): Promise<KnowledgeGraphDTO> {
  const response = await fetch(`/api/graph?seed=${encodeURIComponent(seed)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load graph: ${response.statusText}`);
  }

  return (await response.json()) as KnowledgeGraphDTO;
}

export async function fetchArticleDetails(title: string): Promise<ArticleDetailsDTO> {
  const response = await fetch(`/api/article/${encodeURIComponent(title)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load article: ${response.statusText}`);
  }

  return (await response.json()) as ArticleDetailsDTO;
}
