/** Keys shown as primary KPI numbers (full-table totals). */
export type OverviewDisplayMetricKey =
  | "users"
  | "sessions"
  | "questions"
  | "errors"
  | "asrLogs"
  | "ttsLogs"
  | "toolCalls";

export type OverviewCounts = {
  /** All rows in `users`. */
  users: number;
  /** `last_seen` within the selected range (trend vs prior window). */
  usersActiveInRange: number;
  /** All rows in `sessions`. */
  sessions: number;
  /** `start_time` within the selected range. */
  sessionsInRange: number;
  /** All rows in `questions`. */
  questions: number;
  /** `created_at` within the selected range. */
  questionsInRange: number;
  /** All rows in `errors`. */
  errors: number;
  errorsInRange: number;
  /** All rows in `asr_logs`. */
  asrLogs: number;
  asrLogsInRange: number;
  /** All rows in `tts_logs`. */
  ttsLogs: number;
  ttsLogsInRange: number;
  /** All rows in `tool_calls`. */
  toolCalls: number;
  toolCallsInRange: number;
};

export type OverviewCountsResponse = {
  from: string;
  to: string;
  counts: OverviewCounts;
};
