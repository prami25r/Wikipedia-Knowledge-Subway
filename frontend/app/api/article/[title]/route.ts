import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CACHE_SECONDS = 180;
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

type ArticleRow = {
  id: string;
  title: string;
  summary: string;
  cluster: string | null;
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ title: string }> },
) {
  const { title: rawTitle } = await context.params;
  const title = decodeURIComponent(rawTitle).trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const search = request.nextUrl.searchParams;
  const page = parsePositiveInt(search.get("page"), 1);
  const pageSize = Math.min(parsePositiveInt(search.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

  const { data: articleData, error: articleError } = await supabase
    .from("articles")
    .select("id,title,summary,cluster")
    .eq("title", title)
    .maybeSingle();

  if (articleError) {
    return NextResponse.json({ error: articleError.message }, { status: 500 });
  }

  if (!articleData) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const article = articleData as ArticleRow;

  const { data: linkRows, error: linkError, count: totalConnections } = await supabase
    .from("links")
    .select("source,target", { count: "exact" })
    .or(`source.eq.${article.id},target.eq.${article.id}`)
    .range(from, to);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const links = (linkRows ?? []) as LinkRow[];
  const connectedIds = Array.from(
    new Set(
      links
        .flatMap((link) => [link.source, link.target])
        .filter((id) => id !== article.id),
    ),
  );

  let connections: string[] = [];

  if (connectedIds.length > 0) {
    const { data: connectedArticles, error: connectedError } = await supabase
      .from("articles")
      .select("id,title")
      .in("id", connectedIds);

    if (connectedError) {
      return NextResponse.json({ error: connectedError.message }, { status: 500 });
    }

    const titleById = new Map(((connectedArticles ?? []) as Array<{ id: string; title: string }>).map((row) => [row.id, row.title]));
    connections = connectedIds.map((id) => titleById.get(id)).filter((value): value is string => Boolean(value));
  }

  return NextResponse.json(
    {
      title: article.title,
      summary: article.summary,
      connections,
      cluster: article.cluster,
      pagination: {
        page,
        pageSize,
        totalConnections: totalConnections ?? 0,
        totalPages: Math.max(Math.ceil((totalConnections ?? 0) / pageSize), 1),
      },
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600`,
      },
    },
  );
}
