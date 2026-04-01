import { describe, it, expect } from "vitest";
import { parseFrontmatter, serializeFrontmatter } from "../../src/lib/frontmatter.js";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter with all fields", () => {
    const raw = `---
title: "Batch processing for large datasets"
type: pattern
tags: [performance, data-pipeline]
confidence: 0.85
source: "session:2026-04-01"
created: "2026-04-01T14:30:00Z"
updated: "2026-04-01T14:30:00Z"
---

When processing datasets over 10k rows, batch processing outperforms row-by-row.`;

    const result = parseFrontmatter(raw);
    expect(result).not.toBeNull();
    expect(result!.frontmatter.title).toBe(
      "Batch processing for large datasets",
    );
    expect(result!.frontmatter.type).toBe("pattern");
    expect(result!.frontmatter.tags).toEqual(["performance", "data-pipeline"]);
    expect(result!.frontmatter.confidence).toBe("0.85");
    expect(result!.frontmatter.source).toBe("session:2026-04-01");
    expect(result!.content).toContain("batch processing outperforms");
  });

  it("returns null for content without frontmatter", () => {
    expect(parseFrontmatter("# Just a heading\n\nSome content.")).toBeNull();
  });

  it("returns null for incomplete frontmatter", () => {
    expect(parseFrontmatter("---\ntitle: test\nno closing")).toBeNull();
  });

  it("handles empty tags", () => {
    const raw = `---
title: "Test"
type: insight
tags: []
confidence: 0.5
---

Content here.`;

    const result = parseFrontmatter(raw);
    expect(result).not.toBeNull();
    expect(result!.frontmatter.tags).toEqual([]);
  });

  it("handles frontmatter without optional fields", () => {
    const raw = `---
type: correction
tags: [fix]
---

A correction.`;

    const result = parseFrontmatter(raw);
    expect(result).not.toBeNull();
    expect(result!.frontmatter.type).toBe("correction");
    expect(result!.frontmatter.title).toBe("");
  });
});

describe("serializeFrontmatter", () => {
  it("produces valid frontmatter markdown", () => {
    const result = serializeFrontmatter(
      {
        title: "Test learning",
        type: "insight",
        tags: ["testing", "example"],
        confidence: 0.8,
        source: "unit-test",
        created: "2026-04-01T00:00:00Z",
        updated: "2026-04-01T00:00:00Z",
      },
      "This is the content.",
    );

    expect(result).toContain("---");
    expect(result).toContain('title: "Test learning"');
    expect(result).toContain("type: insight");
    expect(result).toContain("tags: [testing, example]");
    expect(result).toContain("confidence: 0.8");
    expect(result).toContain("This is the content.");
  });

  it("roundtrips through parse", () => {
    const original = {
      title: "Roundtrip test",
      type: "pattern",
      tags: ["a", "b"],
      confidence: 0.9,
      source: "test",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
    };
    const content = "Some content here.";

    const serialized = serializeFrontmatter(original, content);
    const parsed = parseFrontmatter(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.frontmatter.title).toBe(original.title);
    expect(parsed!.frontmatter.type).toBe(original.type);
    expect(parsed!.frontmatter.tags).toEqual(original.tags);
    expect(parsed!.content).toBe(content);
  });

  it("omits source when not provided", () => {
    const result = serializeFrontmatter(
      {
        title: "No source",
        type: "insight",
        tags: [],
        confidence: 0.7,
        created: "2026-04-01T00:00:00Z",
        updated: "2026-04-01T00:00:00Z",
      },
      "Content.",
    );

    expect(result).not.toContain("source:");
  });
});
