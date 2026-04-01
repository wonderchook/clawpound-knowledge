import fs from "node:fs/promises";
import path from "node:path";
import {
  parseFrontmatter,
  serializeFrontmatter,
  type KnowledgeFrontmatter,
  type ParsedKnowledgeFile,
} from "./frontmatter.js";
import { slugify } from "./paths.js";

export interface KnowledgeEntry extends ParsedKnowledgeFile {
  filename: string;
  filePath: string;
}

export interface SaveOptions {
  title: string;
  content: string;
  type: string;
  tags: string[];
  confidence?: number;
  source?: string;
}

/**
 * List all knowledge entries in the knowledge directory.
 */
export async function listEntries(
  knowledgeDir: string,
): Promise<KnowledgeEntry[]> {
  let files: string[];
  try {
    files = await fs.readdir(knowledgeDir);
  } catch {
    return [];
  }

  const entries: KnowledgeEntry[] = [];
  for (const filename of files) {
    if (!filename.endsWith(".md")) continue;

    const filePath = path.join(knowledgeDir, filename);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = parseFrontmatter(raw);
      if (parsed) {
        entries.push({ ...parsed, filename, filePath });
      }
    } catch {
      // Skip unreadable files
    }
  }

  return entries;
}

/**
 * Search knowledge entries by query text, tags, and/or type.
 */
export async function searchEntries(
  knowledgeDir: string,
  options: {
    query?: string;
    tags?: string[];
    type?: string;
    maxResults?: number;
  },
): Promise<KnowledgeEntry[]> {
  const all = await listEntries(knowledgeDir);
  const maxResults = options.maxResults ?? 10;

  let filtered = all;

  if (options.type) {
    filtered = filtered.filter(
      (e) => e.frontmatter.type === options.type,
    );
  }

  if (options.tags && options.tags.length > 0) {
    const searchTags = new Set(options.tags.map((t) => t.toLowerCase()));
    filtered = filtered.filter((e) =>
      e.frontmatter.tags.some((t) => searchTags.has(t.toLowerCase())),
    );
  }

  if (options.query) {
    const q = options.query.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.frontmatter.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.frontmatter.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return filtered.slice(0, maxResults);
}

/**
 * Find entries that may conflict with or be superseded by a new learning.
 */
export async function findStaleEntries(
  knowledgeDir: string,
  newLearning: { title: string; content: string; tags: string[] },
): Promise<{
  contradicted: KnowledgeEntry[];
  superseded: KnowledgeEntry[];
  complementary: KnowledgeEntry[];
}> {
  const all = await listEntries(knowledgeDir);
  const newTags = new Set(newLearning.tags.map((t) => t.toLowerCase()));
  const newWords = new Set(
    newLearning.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  const contradicted: KnowledgeEntry[] = [];
  const superseded: KnowledgeEntry[] = [];
  const complementary: KnowledgeEntry[] = [];

  for (const entry of all) {
    const entryTags = new Set(
      entry.frontmatter.tags.map((t) => t.toLowerCase()),
    );
    const tagOverlap = [...entryTags].filter((t) => newTags.has(t)).length;

    const titleWords = new Set(
      entry.frontmatter.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
    const titleOverlap = [...titleWords].filter((w) =>
      newWords.has(w),
    ).length;

    // No meaningful overlap — skip
    if (tagOverlap === 0 && titleOverlap === 0) continue;

    // High overlap in both tags and title suggests potential conflict
    if (tagOverlap >= 2 && titleOverlap >= 1) {
      // Same topic — check if it's a contradiction or supersession
      if (entry.frontmatter.type === "correction") {
        // Existing correction might be superseded by new info
        superseded.push(entry);
      } else {
        contradicted.push(entry);
      }
    } else if (tagOverlap >= 1) {
      // Some overlap — likely complementary
      complementary.push(entry);
    }
  }

  return { contradicted, superseded, complementary };
}

/**
 * Save a new knowledge entry. Returns the file path.
 * Checks for duplicate titles before saving.
 */
export async function saveEntry(
  knowledgeDir: string,
  options: SaveOptions,
): Promise<{ filePath: string; isDuplicate: boolean; existingPath?: string }> {
  // Ensure directory exists
  await fs.mkdir(knowledgeDir, { recursive: true });

  const slug = slugify(options.title);
  const filename = `${slug}.md`;
  const filePath = path.join(knowledgeDir, filename);

  // Check for existing file with same slug
  try {
    await fs.access(filePath);
    return { filePath, isDuplicate: true, existingPath: filePath };
  } catch {
    // File doesn't exist, proceed
  }

  const now = new Date().toISOString();
  const frontmatter: KnowledgeFrontmatter = {
    title: options.title,
    type: options.type,
    tags: options.tags,
    confidence: options.confidence ?? 0.7,
    source: options.source,
    created: now,
    updated: now,
  };

  const fileContent = serializeFrontmatter(frontmatter, options.content);
  await fs.writeFile(filePath, fileContent, "utf8");

  return { filePath, isDuplicate: false };
}
