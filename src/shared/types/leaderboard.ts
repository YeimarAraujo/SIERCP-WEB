export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  averageScore: number;
  totalSessions: number;
  trend: 'up' | 'down' | 'minus';
  updatedAt: Date;
}
