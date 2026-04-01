import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  listEntries,
  searchEntries,
  saveEntry,
  findStaleEntries,
} from "../../src/lib/knowledge-store.js";
import { serializeFrontmatter } from "../../src/lib/frontmatter.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ck-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function writeTestEntry(
  filename: string,
  title: string,
  type: string,
  tags: string[],
  content: string,
) {
  const md = serializeFrontmatter(
    {
      title,
      type,
      tags,
      confidence: 0.8,
      created: "2026-04-01T00:00:00Z",
      updated: "2026-04-01T00:00:00Z",
    },
    content,
  );
  await fs.writeFile(path.join(tmpDir, filename), md, "utf8");
}

describe("listEntries", () => {
  it("returns empty array for nonexistent directory", async () => {
    const result = await listEntries("/nonexistent/path");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty directory", async () => {
    const result = await listEntries(tmpDir);
    expect(result).toEqual([]);
  });

  it("lists all valid entries", async () => {
    await writeTestEntry("a.md", "First", "insight", ["tag1"], "Content A");
    await writeTestEntry("b.md", "Second", "pattern", ["tag2"], "Content B");

    const result = await listEntries(tmpDir);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.frontmatter.title)).toContain("First");
    expect(result.map((e) => e.frontmatter.title)).toContain("Second");
  });

  it("skips non-md files", async () => {
    await writeTestEntry("a.md", "Valid", "insight", [], "Content");
    await fs.writeFile(path.join(tmpDir, "notes.txt"), "not markdown", "utf8");

    const result = await listEntries(tmpDir);
    expect(result).toHaveLength(1);
  });
});

describe("searchEntries", () => {
  beforeEach(async () => {
    await writeTestEntry(
      "batch-processing.md",
      "Batch processing for datasets",
      "pattern",
      ["performance", "data"],
      "Use batch processing for large datasets.",
    );
    await writeTestEntry(
      "api-retry.md",
      "API retry with backoff",
      "technique",
      ["reliability", "api"],
      "Always use exponential backoff for retries.",
    );
    await writeTestEntry(
      "wrong-metric.md",
      "MRR calculation was wrong",
      "correction",
      ["metrics", "data"],
      "Use dashboard X, not dashboard Y.",
    );
  });

  it("filters by type", async () => {
    const results = await searchEntries(tmpDir, { type: "correction" });
    expect(results).toHaveLength(1);
    expect(results[0].frontmatter.title).toBe("MRR calculation was wrong");
  });

  it("filters by tags", async () => {
    const results = await searchEntries(tmpDir, { tags: ["data"] });
    expect(results).toHaveLength(2);
  });

  it("filters by query text", async () => {
    const results = await searchEntries(tmpDir, { query: "backoff" });
    expect(results).toHaveLength(1);
    expect(results[0].frontmatter.title).toBe("API retry with backoff");
  });

  it("combines filters", async () => {
    const results = await searchEntries(tmpDir, {
      tags: ["data"],
      type: "pattern",
    });
    expect(results).toHaveLength(1);
    expect(results[0].frontmatter.title).toBe(
      "Batch processing for datasets",
    );
  });

  it("respects maxResults", async () => {
    const results = await searchEntries(tmpDir, { maxResults: 1 });
    expect(results).toHaveLength(1);
  });

  it("returns empty for no matches", async () => {
    const results = await searchEntries(tmpDir, { query: "nonexistent" });
    expect(results).toHaveLength(0);
  });
});

describe("saveEntry", () => {
  it("creates a new entry", async () => {
    const result = await saveEntry(tmpDir, {
      title: "New Learning",
      content: "Something we discovered.",
      type: "insight",
      tags: ["discovery"],
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.filePath).toContain("new-learning.md");

    const content = await fs.readFile(result.filePath, "utf8");
    expect(content).toContain("New Learning");
    expect(content).toContain("insight");
    expect(content).toContain("discovery");
  });

  it("detects duplicate by slug", async () => {
    await saveEntry(tmpDir, {
      title: "Existing Entry",
      content: "First version.",
      type: "pattern",
      tags: ["test"],
    });

    const result = await saveEntry(tmpDir, {
      title: "Existing Entry",
      content: "Second version.",
      type: "insight",
      tags: ["test"],
    });

    expect(result.isDuplicate).toBe(true);
  });

  it("creates directory if needed", async () => {
    const nestedDir = path.join(tmpDir, "nested", "knowledge");
    const result = await saveEntry(nestedDir, {
      title: "Nested Entry",
      content: "Content.",
      type: "insight",
      tags: [],
    });

    expect(result.isDuplicate).toBe(false);
    const exists = await fs
      .access(result.filePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });
});

describe("findStaleEntries", () => {
  beforeEach(async () => {
    await writeTestEntry(
      "old-metrics.md",
      "Revenue comes from dashboard A",
      "correction",
      ["metrics", "revenue", "data-source"],
      "Always use dashboard A for revenue.",
    );
    await writeTestEntry(
      "batch-size.md",
      "Optimal batch size is 500",
      "pattern",
      ["performance", "batch"],
      "500 rows per batch is optimal.",
    );
    await writeTestEntry(
      "unrelated.md",
      "CSS grid is better than flexbox for layouts",
      "technique",
      ["frontend", "css"],
      "Use CSS grid.",
    );
  });

  it("finds contradicted entries with overlapping tags and title", async () => {
    const result = await findStaleEntries(tmpDir, {
      title: "Revenue now comes from dashboard B",
      content: "Dashboard B is the new source of truth.",
      tags: ["metrics", "revenue", "data-source"],
    });

    expect(result.contradicted.length + result.superseded.length).toBeGreaterThan(0);
    expect(result.complementary).toHaveLength(0);
  });

  it("returns empty for unrelated entries", async () => {
    const result = await findStaleEntries(tmpDir, {
      title: "Python type hints are useful",
      content: "Use type hints.",
      tags: ["python", "typing"],
    });

    expect(result.contradicted).toHaveLength(0);
    expect(result.superseded).toHaveLength(0);
    expect(result.complementary).toHaveLength(0);
  });
});
