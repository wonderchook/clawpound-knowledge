import { Type } from "@sinclair/typebox";

/**
 * Inline helpers matching openclaw's plugin-sdk exports, so the plugin
 * works even on older gateway builds where the compat shim doesn't
 * re-export these.
 */

type StringEnumOptions<T extends readonly string[]> = {
  description?: string;
  default?: T[number];
};

export function stringEnum<T extends readonly string[]>(
  values: T,
  options: StringEnumOptions<T> = {},
) {
  return Type.Unsafe<T[number]>({
    type: "string",
    enum: [...values],
    ...options,
  });
}

export function optionalStringEnum<T extends readonly string[]>(
  values: T,
  options: StringEnumOptions<T> = {},
) {
  return Type.Optional(stringEnum(values, options));
}

export function jsonResult(payload: unknown) {
  return {
    type: "tool_result" as const,
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}
