import {ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal} from '@angular/core';
import {TuiButton, TuiRoot} from '@taiga-ui/core';

import {NotificationCard} from './notification-card/notification-card';
import {NotificationMotion} from './notification-motion.service';
import {Notification, NotificationPriority} from './notification.model';

const MAX_NOTIFICATIONS = 6;
const MIN_PANEL_HEIGHT = 640;
const MAX_PANEL_HEIGHT = 1040;

const INITIAL_NOTIFICATIONS: readonly Notification[] = [
  {id: 1, caption: 'Документы на подпись', title: '1 документ', asset: 'avatar-docs-sign', priority: 'action'},
  {id: 2, caption: 'Обновление документов', title: 'Загрузите их до 25 октября', asset: 'avatar-docs-update', tone: 'neutral', priority: 'regular'},
  {id: 3, caption: 'Поможем с налогами', title: 'Воспользуйтесь овердрафтом для оплаты налогов', asset: 'info-32', accessory: true, wrap: true, priority: 'regular'},
];

const INCOMING_NOTIFICATIONS: readonly Omit<Notification, 'id'>[] = [
  {caption: 'ФССП', title: 'Новое исполнительное производство', asset: 'avatar-fssp', tone: 'negative-strong', priority: 'alert', wrap: true},
  {caption: 'Ошибка подписания', title: 'Не удалось подписать документы', asset: 'avatar-docs-error', tone: 'negative-strong', priority: 'alert', wrap: true},
  {caption: 'Бухгалтерия', title: 'Бухгалтер свяжется с вами в течение 1 рабочего дня', asset: 'avatar-accounting', tone: 'positive', priority: 'regular', wrap: true},
  {caption: 'Долями', title: 'Подключаем', asset: 'progress-dolyami', progress: true, priority: 'regular'},
  {caption: 'Штраф за пропуск платежа', title: 'Списано 3 500 ₽. Погасите просроченную задолженность', asset: 'avatar-penalty', tone: 'negative', priority: 'alert', wrap: true},
  {caption: 'Овердрафт', title: 'Лимит овердрафта обнулен. Погасите задолженность', asset: 'avatar-overdraft', tone: 'negative', priority: 'alert', wrap: true},
];

@Component({
  selector: 'app-root',
  imports: [NotificationCard, TuiButton, TuiRoot],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(NotificationMotion);
  private readonly initialSingleNotification: Notification = {
    id: 0,
    caption: 'Документы на подпись',
    title: '1 документ',
    asset: 'pencil-20',
    priority: 'regular',
  };
  protected readonly singleNotification = signal<Notification>(this.initialSingleNotification);
  protected readonly activeView = signal<'notification' | 'panel'>('notification');
  protected readonly singleVisible = signal(true);
  protected readonly notifications = signal<readonly Notification[]>(INITIAL_NOTIFICATIONS);
  protected readonly panelHeight = signal(MAX_PANEL_HEIGHT);
  protected readonly isLoading = signal(false);
  protected readonly copyToast = signal('');
  protected readonly limitToast = signal(false);

  private readonly incomingIndex = signal(0);
  private nextId = 4;
  private resizeOrigin?: {clientY: number; height: number};
  private copyTimer?: ReturnType<typeof setTimeout>;
  private limitTimer?: ReturnType<typeof setTimeout>;

  protected readonly visibleLimit = computed(() =>
    Math.min(MAX_NOTIFICATIONS, Math.max(3, Math.floor((this.panelHeight() - 360) / 110))),
  );
  protected readonly sortedNotifications = computed(() =>
    [...this.notifications()].sort(
      (left, right) => this.priority(left.priority) - this.priority(right.priority) || left.id - right.id,
    ),
  );
  protected readonly visibleNotifications = computed(() => this.sortedNotifications().slice(0, this.visibleLimit()));
  protected readonly overflowCount = computed(() => Math.max(0, this.notifications().length - this.visibleNotifications().length));
  protected readonly canAdd = computed(() => !this.isLoading() && this.notifications().length < MAX_NOTIFICATIONS && this.overflowCount() === 0);

  protected selectView(view: 'notification' | 'panel'): void {
    this.activeView.set(view);
  }

  protected reset(): void {
    this.singleVisible.set(true);
    this.singleNotification.set(this.initialSingleNotification);
    this.notifications.set(INITIAL_NOTIFICATIONS);
    this.panelHeight.set(MAX_PANEL_HEIGHT);
    this.incomingIndex.set(0);
    this.isLoading.set(false);
    this.limitToast.set(false);
  }

  protected hideSingle(): void {
    const stage = this.elementRef.nativeElement.querySelector<HTMLElement>('.notification-demo');
    const target = stage?.querySelector<HTMLElement>('[data-notification-id="0"]');

    if (!stage || !target) return;

    this.motion.remove(stage, target, () => this.singleVisible.set(false));
  }

  protected hideNotification(id: number): void {
    const target = this.notifications().find((item) => item.id === id);

    const stage = this.elementRef.nativeElement.querySelector<HTMLElement>('.sidepanel');
    const element = stage?.querySelector<HTMLElement>(`[data-notification-id="${id}"]`);

    if (!target || target.priority !== 'regular' || !stage || !element) return;

    this.motion.remove(stage, element, () => {
      this.notifications.update((items) => items.filter((item) => item.id !== id));
    });
  }

  protected async addNotification(sessionStart = false): Promise<void> {
    if (!this.canAdd()) {
      this.showLimitToast();
      return;
    }

    this.isLoading.set(true);
    await this.delay(sessionStart ? 280 : 360);

    const index = this.incomingIndex() % INCOMING_NOTIFICATIONS.length;
    const source = INCOMING_NOTIFICATIONS[index];
    const stage = this.elementRef.nativeElement.querySelector<HTMLElement>('.sidepanel');
    const addedId = this.nextId++;
    const update = () => this.notifications.update((items) => [
      ...items,
      {...source, id: addedId},
    ]);

    if (stage) {
      this.motion.insert(
        stage,
        addedId,
        update,
        sessionStart && source.priority === 'alert',
      );
    } else {
      update();
    }
    this.incomingIndex.update((value) => value + 1);
    this.isLoading.set(false);

  }

  protected setPanelHeight(event: Event): void {
    this.panelHeight.set(this.clampHeight(Number((event.target as HTMLInputElement).value)));
  }

  protected beginResize(event: PointerEvent): void {
    this.resizeOrigin = {clientY: event.clientY, height: this.panelHeight()};
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected resizeFromKeyboard(event: KeyboardEvent): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    event.preventDefault();
    this.panelHeight.set(this.clampHeight(this.panelHeight() + (event.key === 'ArrowDown' ? 20 : -20)));
  }

  @HostListener('window:pointermove', ['$event'])
  protected continueResize(event: PointerEvent): void {
    if (!this.resizeOrigin) return;

    this.panelHeight.set(this.clampHeight(this.resizeOrigin.height + event.clientY - this.resizeOrigin.clientY));
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  protected endResize(): void {
    this.resizeOrigin = undefined;
  }

  protected async copyParams(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyToast('Параметры скопированы');
    } catch {
      this.showCopyToast('Не удалось скопировать');
    }
  }

  private showCopyToast(message: string): void {
    clearTimeout(this.copyTimer);
    this.copyToast.set(message);
    this.copyTimer = setTimeout(() => this.copyToast.set(''), 1400);
  }

  private showLimitToast(): void {
    clearTimeout(this.limitTimer);
    this.limitToast.set(true);
    this.limitTimer = setTimeout(() => this.limitToast.set(false), 3000);
  }

  private priority(priority: NotificationPriority): number {
    return priority === 'alert' ? 0 : priority === 'action' ? 1 : 2;
  }

  private clampHeight(value: number): number {
    return Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, Math.round(value)));
  }

  private delay(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
}
