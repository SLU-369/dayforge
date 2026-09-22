import type { JsonValue } from "../contracts/index.ts";

export function canonicalStringify(value: JsonValue): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON accepts only finite numbers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }

  const entries = Object.entries(value).sort(([left], [right]) => (
    left < right ? -1 : left > right ? 1 : 0
  ));
  return `{${entries.map(([key, item]) => (
    `${JSON.stringify(key)}:${canonicalStringify(item)}`
  )).join(",")}}`;
}
