/** Product identity — conversational AG-UI: dashboards from natural-language queries. */

export const PRODUCT_NAME = "Monocle";

/** Primary tagline (sentence case). */
export const PRODUCT_TAGLINE = "One lens, many views";

/** Same tagline for mid-sentence copy (lowercase). */
export const PRODUCT_TAGLINE_LOWER = "one lens, many views";

/** Single line for titles, metadata, and headers. */
export const PRODUCT_LINE = `${PRODUCT_NAME} — ${PRODUCT_TAGLINE}` as const;

/**
 * Human explanation under the headline (auth, marketing). Not the short tagline—this is what the product *does*.
 */
export const PRODUCT_VALUE_PROP =
  "Every question deserves its own layout. Ask in plain language—Monocle assembles the metrics and charts to answer it.";

/** Short description for meta tags and assistants. */
export const PRODUCT_DESCRIPTION =
  "Conversational analytics: plain-language questions, dashboards composed per answer—one lens on your data.";
