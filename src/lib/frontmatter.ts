/**
 * YAML frontmatter parser and serializer for knowledge entries.
 * Handles the --- delimited frontmatter blocks in markdown files.
 */

export interface KnowledgeFrontmatter {
  title: string;
  type: string;
  tags: string[];
  confidence: number | string;
  source?: string;
  created: string;
  updated: string;
}

export interface ParsedKnowledgeFile {
  frontmatter: KnowledgeFrontmatter;
  content: string;
}

/**
 * Parse YAML frontmatter from a markdown string.
 * Expects --- delimited frontmatter at the start of the file.
 */
export function parseFrontmatter(raw: string): ParsedKnowledgeFile | null {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return null;
  }

  const endIndex = trimmed.indexOf("---", 3);
  if (endIndex === -1) {
    return null;
  }

  const frontmatterBlock = trimmed.slice(3, endIndex).trim();
  const content = trimmed.slice(endIndex + 3).trim();

  const frontmatter = parseYamlSimple(frontmatterBlock);
  if (!frontmatter || !frontmatter.type) {
    return null;
  }

  return {
    frontmatter: {
      title: frontmatter.title ?? "",
      type: frontmatter.type,
      tags: parseTags(frontmatter.tags),
      confidence: frontmatter.confidence ?? 0.7,
      source: frontmatter.source,
      created: frontmatter.created ?? new Date().toISOString(),
      updated: frontmatter.updated ?? new Date().toISOString(),
    },
    content,
  };
}

/**
 * Serialize a knowledge entry to a markdown string with YAML frontmatter.
 */
export function serializeFrontmatter(
  frontmatter: KnowledgeFrontmatter,
  content: string,
): string {
  const tagsStr =
    frontmatter.tags.length > 0
      ? `[${frontmatter.tags.join(", ")}]`
      : "[]";

  const lines = [
    "---",
    `title: "${escapeFmString(frontmatter.title)}"`,
    `type: ${frontmatter.type}`,
    `tags: ${tagsStr}`,
    `confidence: ${frontmatter.confidence}`,
  ];

  if (frontmatter.source) {
    lines.push(`source: "${escapeFmString(frontmatter.source)}"`);
  }

  lines.push(`created: "${frontmatter.created}"`);
  lines.push(`updated: "${frontmatter.updated}"`);
  lines.push("---");
  lines.push("");
  lines.push(content);

  return lines.join("\n");
}

function escapeFmString(s: string): string {
  return s.replace(/"/g, '\\"');
}

/**
 * Simple YAML key-value parser. Handles flat key: value pairs
 * and simple array syntax [a, b, c].
 */
function parseYamlSimple(block: string): Record<string, string> | null {
  const result: Record<string, string> = {};

  for (const line of block.split("\n")) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const colonIdx = trimmedLine.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmedLine.slice(0, colonIdx).trim();
    let value = trimmedLine.slice(colonIdx + 1).trim();

    // Strip quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Parse tags from a YAML value. Handles both [a, b, c] array syntax
 * and plain comma-separated strings.
 */
function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];

  let value = raw.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    value = value.slice(1, -1);
  }

  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
