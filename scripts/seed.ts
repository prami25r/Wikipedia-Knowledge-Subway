import { createClient } from "@supabase/supabase-js";
import { createDemoGraphDTO } from "@/lib/graph";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedDatabase() {
  const graph = createDemoGraphDTO();

  const records = graph.edges.map((edge) => {
    const source = graph.nodes.find((node) => node.id === edge.source);
    const target = graph.nodes.find((node) => node.id === edge.target);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      source_label: source?.attributes.label ?? edge.source,
      target_label: target?.attributes.label ?? edge.target,
    };
  });

  const { error } = await supabase.from("wikipedia_edges").upsert(records, { onConflict: "id" });

  if (error) {
    throw error;
  }

  console.log(`Seeded ${records.length} edge records.`);
}

void seedDatabase();
