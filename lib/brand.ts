/** Product identity — conversational AG-UI: dashboards from natural-language queries. */

export const PRODUCT_NAME = "Monocle";

/** Primary tagline (sentence case). */
export const PRODUCT_TAGLINE = "One lens, many views";

/** Same tagline for mid-sentence copy (lowercase). */
export const PRODUCT_TAGLINE_LOWER = "one lens, many views";

/** Single line for titles, metadata, and headers. */
export const PRODUCT_LINE = `${PRODUCT_NAME} — ${PRODUCT_TAGLINE}` as const;

/** Short description for meta tags and assistants. */
export const PRODUCT_DESCRIPTION =
  "Ask in natural language. One lens, many views — analytics dashboards that reshape to every question.";
