export type NotificationPriority = 'alert' | 'action' | 'regular';
export type NotificationTone = 'neutral' | 'negative' | 'negative-strong' | 'positive';

export interface Notification {
  readonly id: number;
  readonly caption: string;
  readonly title: string;
  readonly asset: string;
  readonly priority: NotificationPriority;
  readonly tone?: NotificationTone;
  readonly accessory?: boolean;
  readonly progress?: boolean;
  readonly wrap?: boolean;
}
