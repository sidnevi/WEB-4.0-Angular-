import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

interface MotionTokens {
  readonly duration: number;
  readonly easing: string;
  readonly popEasing: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationMotion {
  private readonly document = inject(DOCUMENT);

  remove(stage: HTMLElement, target: HTMLElement, update: () => void): void {
    const moving = this.motionItems(stage).filter((element) => element !== target);
    const firstRects = this.captureRects(moving);
    const card = target.querySelector<HTMLElement>('.notification-card');

    if (!card) {
      update();
      return;
    }

    const rect = card.getBoundingClientRect();
    const ghost = card.cloneNode(true) as HTMLElement;
    ghost.classList.add('notification-ghost');
    Object.assign(ghost.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    this.document.body.appendChild(ghost);

    update();

    requestAnimationFrame(() => {
      if (this.reducedMotion()) {
        this.fadeOut(ghost);
        return;
      }

      const tokens = this.tokens(stage);
      this.playFlip(moving, firstRects, tokens);
      const exit = ghost.animate(
        [
          { opacity: 1, transform: 'translateY(0) scale(1)' },
          { opacity: 0, transform: 'translateY(-4px) scale(.86)' },
        ],
        { duration: tokens.duration, easing: tokens.easing, fill: 'forwards' },
      );

      void exit.finished.catch(() => undefined).finally(() => ghost.remove());
    });
  }

  insert(stage: HTMLElement, id: number, update: () => void, critical = false): void {
    const moving = this.motionItems(stage);
    const firstRects = this.captureRects(moving);
    update();

    requestAnimationFrame(() => {
      const card = stage.querySelector<HTMLElement>(
        `[data-notification-id="${id}"] .notification-card`,
      );

      if (this.reducedMotion()) {
        card?.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: this.fastDuration(stage),
          easing: 'ease-out',
        });
        return;
      }

      const tokens = this.tokens(stage);
      this.playFlip(moving, firstRects, tokens);

      if (!card) return;

      const entry = card.animate(
        [
          { opacity: 0, transform: 'scale(.86)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: tokens.duration, easing: tokens.easing, fill: 'both' },
      );

      if (critical) {
        void entry.finished
          .catch(() => undefined)
          .then(() =>
            card.animate(
              [{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(1)' }],
              { duration: tokens.duration, easing: tokens.popEasing },
            ),
          );
      }
    });
  }

  private playFlip(
    elements: readonly HTMLElement[],
    firstRects: ReadonlyMap<HTMLElement, DOMRect>,
    tokens: MotionTokens,
  ): void {
    for (const element of elements) {
      if (!element.isConnected) continue;

      const first = firstRects.get(element);
      if (!first) continue;

      const last = element.getBoundingClientRect();
      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;
      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) continue;

      element.animate(
        [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'translate(0, 0)' }],
        { duration: tokens.duration, easing: tokens.easing, fill: 'both' },
      );
    }
  }

  private motionItems(stage: HTMLElement): HTMLElement[] {
    return Array.from(stage.querySelectorAll<HTMLElement>('[data-motion-item]'));
  }

  private captureRects(elements: readonly HTMLElement[]): Map<HTMLElement, DOMRect> {
    return new Map(elements.map((element) => [element, element.getBoundingClientRect()]));
  }

  private tokens(element: HTMLElement): MotionTokens {
    const style = getComputedStyle(element);

    return {
      duration: this.resolveDuration(element, '--tui-duration-slow', 500),
      easing:
        style.getPropertyValue('--tui-curve-expressive-entrance').trim() ||
        'cubic-bezier(0.35, 1.3, 0.25, 1)',
      popEasing:
        style.getPropertyValue('--tui-curve-expressive-standard').trim() ||
        'cubic-bezier(0.4, 0.1, 0.2, 1)',
    };
  }

  private fastDuration(element: HTMLElement): number {
    return this.resolveDuration(element, '--tui-duration-fastest', 75);
  }

  private resolveDuration(element: HTMLElement, token: string, fallback: number): number {
    const probe = this.document.createElement('span');
    probe.style.animationDuration = `var(${token})`;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    element.appendChild(probe);
    const value = getComputedStyle(probe).animationDuration.trim();
    probe.remove();

    if (value.endsWith('ms')) return Number.parseFloat(value) || fallback;
    if (value.endsWith('s')) return (Number.parseFloat(value) || fallback / 1000) * 1000;

    return fallback;
  }

  private reducedMotion(): boolean {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private fadeOut(element: HTMLElement): void {
    const exit = element.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: this.fastDuration(element),
      easing: 'ease-out',
      fill: 'forwards',
    });
    void exit.finished.catch(() => undefined).finally(() => element.remove());
  }
}
