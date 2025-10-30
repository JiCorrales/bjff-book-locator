export type FeedbackRating = 'up' | 'down';

export interface FeedbackEntry {
  assistantMessage?: string;
  rating: FeedbackRating;
  comment?: string;
  createdAt: string;
  userAgent?: string;
  ip?: string;
}

class InMemoryFeedbackRepository {
  private readonly store: FeedbackEntry[] = [];

  add(entry: FeedbackEntry) {
    this.store.push(entry);
  }

  all(): FeedbackEntry[] {
    return [...this.store];
  }
}

export const feedbackRepository = new InMemoryFeedbackRepository();