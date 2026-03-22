import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { KnowledgeGraphDTO } from "@/types/graph";

const CACHE_SECONDS = 120;
const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 100;

type ArticleRow = {
  id: string;
  title: string;
  cluster: string | null;
  x: number;
  y: number;
  degree: number;
};

type LinkRow = {
  source: string;
  target: string;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function toGraphDTO(nodes: ArticleRow[], links: LinkRow[]): KnowledgeGraphDTO {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      attributes: {
        label: node.title,
        x: node.x,
        y: node.y,
        size: Math.max(node.degree, 1),
        color: "#38bdf8",
      },
    })),
    edges: links.map((link, index) => ({
      id: `edge-${index}-${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      attributes: {
        color: "#475569",
        size: 1,
      },
    })),
  };
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const page = parsePositiveInt(search.get("page"), 1);
  const pageSize = Math.min(parsePositiveInt(search.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const cluster = search.get("cluster")?.trim() || null;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let nodeQuery = supabase
    .from("articles")
    .select("id,title,cluster,x,y,degree", { count: "exact" })
    .order("degree", { ascending: false })
    .range(from, to);

  if (cluster) {
    nodeQuery = nodeQuery.eq("cluster", cluster);
  }

  const { data: nodeRows, error: nodeError, count: totalNodes } = await nodeQuery;

  if (nodeError) {
    return NextResponse.json({ error: nodeError.message }, { status: 500 });
  }

  const nodes = (nodeRows ?? []) as ArticleRow[];

  if (nodes.length === 0) {
    return NextResponse.json(
      {
        nodes: [],
        edges: [],
        pagination: {
          page,
          pageSize,
          totalNodes: totalNodes ?? 0,
          totalPages: Math.max(Math.ceil((totalNodes ?? 0) / pageSize), 1),
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600`,
        },
      },
    );
  }

  const nodeIds = nodes.map((node) => node.id);

  const { data: links, error: linkError } = await supabase
    .from("links")
    .select("source,target")
    .in("source", nodeIds)
    .in("target", nodeIds)
    .limit(pageSize * 4);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const graph = toGraphDTO(nodes, (links ?? []) as LinkRow[]);

  return NextResponse.json(
    {
      ...graph,
      pagination: {
        page,
        pageSize,
        totalNodes: totalNodes ?? 0,
        totalPages: Math.max(Math.ceil((totalNodes ?? 0) / pageSize), 1),
      },
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600`,
      },
    },
  );
}
