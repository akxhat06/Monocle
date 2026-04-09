export type OverviewCounts = {
  users: number;
  sessions: number;
  questions: number;
  errors: number;
  asrLogs: number;
  ttsLogs: number;
  toolCalls: number;
};

export type OverviewCountsResponse = {
  from: string;
  to: string;
  counts: OverviewCounts;
};
