import type { JsonLdNode } from "@/core/jsonld";

/**
 * Injects a JSON-LD structured-data block. Server component (no client JS).
 * `<` is escaped to < so the serialized JSON can never break out of the
 * <script> element (the standard XSS-safe JSON-LD serialization).
 */
export function JsonLd({ data }: { data: JsonLdNode }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
