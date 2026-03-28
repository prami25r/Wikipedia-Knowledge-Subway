import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

type LayoutGraph = {
  nodes: Array<{
    id: string;
    label: string;
    cluster: string;
    x: number;
    y: number;
    degree?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFileIfPresent(filePath: string): void {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(filePath)) {
    process.loadEnvFile(filePath);
  }
}

function loadCredentials(): { url: string; key: string } {
  loadEnvFileIfPresent(path.resolve(__dirname, '../.env'));
  loadEnvFileIfPresent(path.resolve(__dirname, '../../.env'));

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY environment variables.');
  }

  return { url, key };
}

function loadLayoutGraph(): LayoutGraph {
  const filePath = path.resolve(__dirname, '../data/layout_graph.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as LayoutGraph;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function seedDatabase() {
  const { url, key } = loadCredentials();
  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });

  const graph = loadLayoutGraph();

  const articles = graph.nodes.map((node) => ({
    id: node.id,
    title: node.label,
    summary: '',
    cluster: node.cluster,
    x: node.x,
    y: node.y,
    degree: node.degree ?? 0,
  }));

  const links = graph.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  for (const batch of chunk(articles, 500)) {
    const { error } = await supabase.from('articles').upsert(batch, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to seed articles: ${error.message}`);
    }
  }

  for (const batch of chunk(links, 1000)) {
    const { error } = await supabase.from('links').upsert(batch, { onConflict: 'source,target' });

    if (error) {
      throw new Error(`Failed to seed links: ${error.message}`);
    }
  }

  console.log(`Seeded ${articles.length} articles and ${links.length} links from backend/data/layout_graph.json.`);
}

void seedDatabase();
