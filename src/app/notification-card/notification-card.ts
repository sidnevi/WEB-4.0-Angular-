import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {Notification} from '../notification.model';

@Component({
  selector: 'app-notification-card',
  templateUrl: './notification-card.html',
  styleUrl: './notification-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-motion-item': '',
    '[attr.data-notification-id]': 'notification().id',
  },
})
export class NotificationCard {
  readonly notification = input.required<Notification>();
  readonly hide = output<number>();

  protected requestHide(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.hide.emit(this.notification().id);
  }
}
