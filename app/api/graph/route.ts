import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createDemoGraphDTO } from "@/lib/graph";
import { supabase } from "@/lib/supabase";
import { KnowledgeGraphDTO } from "@/types/graph";

const CACHE_SECONDS = 60;

type GraphRow = {
  id: string;
  source: string;
  target: string;
  source_label: string;
  target_label: string;
};

function rowsToGraph(rows: GraphRow[]): KnowledgeGraphDTO {
  const nodeMap = new Map<string, KnowledgeGraphDTO["nodes"][number]>();

  for (const row of rows) {
    if (!nodeMap.has(row.source)) {
      nodeMap.set(row.source, {
        id: row.source,
        attributes: {
          label: row.source_label,
          color: "#38bdf8",
          x: Math.random() * 2,
          y: Math.random() * 2,
          size: 12,
        },
      });
    }

    if (!nodeMap.has(row.target)) {
      nodeMap.set(row.target, {
        id: row.target,
        attributes: {
          label: row.target_label,
          color: "#818cf8",
          x: Math.random() * 2,
          y: Math.random() * 2,
          size: 10,
        },
      });
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: rows.map((row, index) => ({
      id: `${row.id}-${index}`,
      source: row.source,
      target: row.target,
      attributes: {
        color: "#475569",
        size: 1,
      },
    })),
  };
}

async function fetchSupabaseGraph(seed: string): Promise<KnowledgeGraphDTO | null> {
  const { data, error } = await supabase
    .from("wikipedia_edges")
    .select("id,source,target,source_label,target_label")
    .or(`source_label.ilike.%${seed}%,target_label.ilike.%${seed}%`)
    .limit(100);

  if (error || !data?.length) {
    return null;
  }

  return rowsToGraph(data as GraphRow[]);
}

async function generateSummary(seed: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `Create one sentence describing how ${seed} might connect to nearby topics in a knowledge graph.`,
  });

  return completion.output_text || null;
}

export async function GET(request: NextRequest) {
  const seed = request.nextUrl.searchParams.get("seed") ?? "Wikipedia";

  try {
    const graph = (await fetchSupabaseGraph(seed)) ?? createDemoGraphDTO();
    const summary = await generateSummary(seed);

    return NextResponse.json({ ...graph, summary }, { headers: { "Cache-Control": `s-maxage=${CACHE_SECONDS}` } });
  } catch {
    return NextResponse.json(createDemoGraphDTO(), {
      headers: { "Cache-Control": `s-maxage=${CACHE_SECONDS}` },
    });
  }
}
