# Motion в Taiga UI 5

В Taiga UI 5 удалены прежние Angular animation triggers. Поэтому эффекты реализованы CSS-анимациями, а их длительности и кривые берутся из design tokens библиотеки.

## Используемые токены

| Роль | Токен Taiga UI |
|---|---|
| Быстрый hover/morph | `--tui-duration-fast` |
| Появление и удаление карточки | `--tui-duration-slow` |
| Обычная интерфейсная кривая | `--tui-curve-productive-standard` |
| Выразительный вход | `--tui-curve-expressive-entrance` |
| Выразительный выход | `--tui-curve-expressive-exit` |
| Выразительный акцент | `--tui-curve-expressive-standard` |

Переменные поставляет подключённая тема `@taiga-ui/styles/taiga-ui-theme.less`; дублировать значения в приложении не нужно.

## Правила эффектов

| Эффект | Длительность | Кривая | Геометрия |
|---|---|---|---|
| Hover карточки | `--tui-duration-fast` | productive standard | фон → `--tui-background-elevation-2`, тень → `--tui-shadow-medium` |
| Вход события | `--tui-duration-slow` | expressive entrance | opacity 0→1, y −4→0, scale .86→1 |
| Принудительное скрытие | `--tui-duration-slow` | expressive entrance | ghost: opacity 1→0, y 0→−4, scale 1→.86; соседи: FLIP |
| Alert после PTR | `--tui-duration-slow` | expressive standard | scale 1→1.035→1 |
| Раскрытие hide-контрола | `--tui-duration-fast` | productive standard | 24×24→55×26, x 0→4 |
| Toast | `--tui-duration-fast` | productive standard | opacity + translateY |

## Angular lifecycle

Angular управляет жизненным циклом элемента через состояние модели:

- при добавлении Angular создаёт элемент из signals-модели, а `NotificationMotion` запускает entry и FLIP соседей;
- при скрытии Angular сразу удаляет карточку из signals-модели, а `NotificationMotion` анимирует ghost и FLIP-перестроение соседей;
- `sessionStart` включает дополнительный pop только для alert после PTR.

Список обновляется декларативно через `@for (...; track notification.id)`. DOMRect измеряется только в Angular-сервисе motion, потому что FLIP-дельты зависят от реальной высоты карток. Длительность и easing сервис читает из `--tui-duration-slow` и `--tui-curve-expressive-entrance`.
