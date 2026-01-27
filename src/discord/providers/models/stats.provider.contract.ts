export interface ServerStatsData {
  messageCount: number;
  joinCount: number;
  leaveCount: number;
  totalVoiceSeconds: number;
}

export interface DailyActivityData {
  day: string;
  count: number;
}