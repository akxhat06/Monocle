/** Keys shown as primary KPI numbers (full-table totals). */
export type OverviewDisplayMetricKey =
  | "users"
  | "calls"
  | "questions"
  | "errors"
  | "asrDetails"
  | "ttsDetails";

export type OverviewCounts = {
  /** All rows in `users`. */
  users: number;
  /** Users with last_seen_at within the selected range. */
  usersActiveInRange: number;
  /** All rows in `calls`. */
  calls: number;
  /** Calls with start_datetime within the selected range. */
  callsInRange: number;
  /** All rows in `questions`. */
  questions: number;
  /** Questions with created_at within the selected range. */
  questionsInRange: number;
  /** All rows in `errordetails`. */
  errors: number;
  errorsInRange: number;
  /** All rows in `asr_details`. */
  asrDetails: number;
  asrDetailsInRange: number;
  /** All rows in `tts_details`. */
  ttsDetails: number;
  ttsDetailsInRange: number;
};

export type OverviewCountsResponse = {
  from: string;
  to: string;
  counts: OverviewCounts;
};
