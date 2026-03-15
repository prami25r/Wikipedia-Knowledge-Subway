import { KnowledgeGraphDTO } from "@/types/graph";

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
