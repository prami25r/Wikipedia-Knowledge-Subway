#!/usr/bin/env node

/**
 * Collects a Wikipedia knowledge graph using seed topics.
 *
 * Output: /data/wiki_graph.json
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const DEFAULT_MAX_ARTICLES = 2000;
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_RATE_LIMIT_MS = 250;

const DEFAULT_SEEDS = [
  "Artificial Intelligence",
  "Physics",
  "Biology",
  "History",
  "Computer Science",
  "Philosophy",
  "Economics",
  "Geography",
  "Arts",
];

function parseArgs(argv) {
  const args = {
    seeds: DEFAULT_SEEDS,
    maxArticles: DEFAULT_MAX_ARTICLES,
    batchSize: DEFAULT_BATCH_SIZE,
    rateLimitMs: DEFAULT_RATE_LIMIT_MS,
    output: path.join(process.cwd(), "data", "wiki_graph.json"),
    seedFile: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--seeds") {
      args.seeds = JSON.parse(argv[i + 1] || "[]");
      i += 1;
    } else if (arg.startsWith("--seeds=")) {
      args.seeds = JSON.parse(arg.slice("--seeds=".length));
    } else if (arg === "--seed-file") {
      args.seedFile = argv[i + 1] || null;
      i += 1;
    } else if (arg.startsWith("--seed-file=")) {
      args.seedFile = arg.slice("--seed-file=".length);
    } else if (arg === "--max-articles") {
      args.maxArticles = Number(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith("--max-articles=")) {
      args.maxArticles = Number(arg.slice("--max-articles=".length));
    } else if (arg === "--batch-size") {
      args.batchSize = Number(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith("--batch-size=")) {
      args.batchSize = Number(arg.slice("--batch-size=".length));
    } else if (arg === "--rate-limit-ms") {
      args.rateLimitMs = Number(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith("--rate-limit-ms=")) {
      args.rateLimitMs = Number(arg.slice("--rate-limit-ms=".length));
    } else if (arg === "--output") {
      args.output = path.resolve(argv[i + 1] || args.output);
      i += 1;
    } else if (arg.startsWith("--output=")) {
      args.output = path.resolve(arg.slice("--output=".length));
    }
  }

  return args;
}

function normalizeTitle(title) {
  return String(title || "").trim().replace(/\s+/g, " ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "WikipediaKnowledgeSubwayBot/1.0 (https://example.local)",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt > retries) {
        break;
      }

      const waitMs = 400 * 2 ** (attempt - 1);
      console.warn(`Request failed (attempt ${attempt}/${retries}). Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }

  throw lastError;
}

async function fetchBatchPageData(titles, rateLimitMs) {
  const pageMap = new Map();
  let continuation = null;

  do {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      redirects: "1",
      prop: "extracts|links|categories",
      exintro: "1",
      explaintext: "1",
      plnamespace: "0",
      pllimit: "max",
      cllimit: "max",
      titles: titles.join("|"),
    });

    if (continuation?.continue) {
      params.set("continue", continuation.continue);
    }

    if (continuation?.plcontinue) {
      params.set("plcontinue", continuation.plcontinue);
    }

    if (continuation?.clcontinue) {
      params.set("clcontinue", continuation.clcontinue);
    }

    const url = `${WIKIPEDIA_API_URL}?${params.toString()}`;
    const json = await fetchWithRetry(url);

    const pages = json?.query?.pages ?? {};

    for (const page of Object.values(pages)) {
      if (!page || page.missing !== undefined || !page.title) {
        continue;
      }

      const existing = pageMap.get(page.title) || {
        title: page.title,
        summary: "",
        links: new Set(),
        categories: new Set(),
      };

      if (!existing.summary && page.extract) {
        existing.summary = String(page.extract).trim();
      }

      const links = Array.isArray(page.links) ? page.links : [];
      for (const link of links) {
        const linkTitle = normalizeTitle(link?.title);
        if (!linkTitle || linkTitle.includes(":")) {
          continue;
        }

        existing.links.add(linkTitle);
      }

      const categories = Array.isArray(page.categories) ? page.categories : [];
      for (const category of categories) {
        const categoryTitle = normalizeTitle(category?.title);
        if (!categoryTitle) {
          continue;
        }

        const label = categoryTitle.replace(/^Category:/i, "");
        if (label) {
          existing.categories.add(label);
        }
      }

      pageMap.set(page.title, existing);
    }

    continuation = json?.continue ?? null;

    if (continuation) {
      await sleep(rateLimitMs);
    }
  } while (continuation);

  return pageMap;
}

function getNextBatch(queue, visited, batchSize) {
  const batch = [];

  while (queue.length > 0 && batch.length < batchSize) {
    const next = normalizeTitle(queue.shift());
    if (!next || visited.has(next)) {
      continue;
    }

    visited.add(next);
    batch.push(next);
  }

  return batch;
}

function parseSeedInput(args) {
  if (!args.seedFile) {
    return Array.isArray(args.seeds) ? args.seeds : DEFAULT_SEEDS;
  }

  return fs
    .readFile(path.resolve(args.seedFile), "utf8")
    .then((content) => JSON.parse(content))
    .catch((error) => {
      throw new Error(`Failed to load seed file: ${error.message}`);
    });
}

async function collectWikipediaGraph(options) {
  const rawSeeds = await parseSeedInput(options);
  if (!Array.isArray(rawSeeds) || rawSeeds.length === 0) {
    throw new Error("Input seeds must be a non-empty JSON array of topics.");
  }

  const seeds = rawSeeds.map(normalizeTitle).filter(Boolean);
  const queue = [...seeds];
  const visited = new Set();
  const nodes = new Map();
  const edgeKeys = new Set();

  while (queue.length > 0 && nodes.size < options.maxArticles) {
    const batch = getNextBatch(queue, visited, options.batchSize);
    if (batch.length === 0) {
      continue;
    }

    try {
      const pageMap = await fetchBatchPageData(batch, options.rateLimitMs);

      for (const pageData of pageMap.values()) {
        if (nodes.size >= options.maxArticles) {
          break;
        }

        nodes.set(pageData.title, {
          id: pageData.title,
          summary: pageData.summary || "",
          categories: Array.from(pageData.categories).sort(),
        });

        for (const target of pageData.links) {
          const edgeKey = `${pageData.title}\t${target}`;
          edgeKeys.add(edgeKey);

          if (!visited.has(target) && queue.length + nodes.size < options.maxArticles * 3) {
            queue.push(target);
          }
        }
      }
    } catch (error) {
      console.error(`Batch failed for titles: ${batch.join(", ")}`);
      console.error(error instanceof Error ? error.message : String(error));
    }

    await sleep(options.rateLimitMs);
  }

  const nodeIds = new Set(nodes.keys());
  const edges = Array.from(edgeKeys)
    .map((key) => {
      const [source, target] = key.split("\t");
      return { source, target };
    })
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!Number.isFinite(args.maxArticles) || args.maxArticles < 1) {
    throw new Error("--max-articles must be a positive number.");
  }

  if (!Number.isFinite(args.batchSize) || args.batchSize < 1) {
    throw new Error("--batch-size must be a positive number.");
  }

  if (!Number.isFinite(args.rateLimitMs) || args.rateLimitMs < 0) {
    throw new Error("--rate-limit-ms must be a non-negative number.");
  }

  const graph = await collectWikipediaGraph(args);

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, JSON.stringify(graph, null, 2), "utf8");

  console.log(`Saved graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges to ${args.output}`);
}

main().catch((error) => {
  console.error("Failed to collect Wikipedia graph:");
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
