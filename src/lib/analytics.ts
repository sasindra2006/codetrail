export type ActivityDay = { date: string; solvedCount: number };
export type TopicProgress = { topic: string; attempted: number; solved: number };
export type DifficultyProgress = { difficulty: "Easy" | "Medium" | "Hard"; attempted: number; solved: number };
export type RecentProblemActivity = {
  problemSlug: string;
  title: string;
  outcome: "solved" | "attempted";
  occurredAt: string;
};

export type LearningAnalyticsSnapshot = {
  totalSolved: number;
  totalAttempted: number;
  currentStreak: number;
  activity: ActivityDay[];
  topics: TopicProgress[];
  difficulties: DifficultyProgress[];
  recentActivity: RecentProblemActivity[];
};
