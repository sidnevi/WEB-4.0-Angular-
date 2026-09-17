# SVG assets

Все продуктовые иконки вынесены из HTML в самостоятельные файлы `public/assets/*.svg` и подключаются обычным `img`.

Иконки событий (`avatar-fssp`, `avatar-docs-*`, `avatar-accounting`, `avatar-penalty`, `avatar-overdraft`, `progress-dolyami`) сохранены как отдельные композиции: в них есть специфичная для события цветовая обработка.

`info-32.svg` также остаётся композитным 32px-ассетом. Inline `<svg>`, `<symbol>` и `<use>` в Angular-шаблонах отсутствуют.
