export interface Membership {
  userId: string;
  displayName: string;
  latestPage: number;
  lastUpdate: Date | null;
  streak: number;
  lastReadDate: string | null;
}
