import fs from "fs";
import path from "path";

const rawDir = path.join(process.cwd(), "data/raw");
const outFile = path.join(process.cwd(), "data/articles.json");

const parseTitle = (url) => {
  const slug = url.split("/wiki/")[1];
  return decodeURIComponent(slug.replace(/_/g, " "));
};

const parseFile = (filePath, line) => {
  const content = fs.readFileSync(filePath, "utf8");

  const urls = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("https://"));

  return urls.map((url) => ({
    id: parseTitle(url),
    url,
    line
  }));
};

const buildDataset = () => {
  const files = fs.readdirSync(rawDir);

  let nodes = [];

  files.forEach((file) => {
    if (!file.endsWith(".md")) return;

    const line = file.replace(".md", "").toLowerCase();
    const filePath = path.join(rawDir, file);

    nodes = nodes.concat(parseFile(filePath, line));
  });

  fs.writeFileSync(outFile, JSON.stringify({ nodes }, null, 2));

  console.log("Parsed files:", files.length);
  console.log("Nodes created:", nodes.length);
};

buildDataset();