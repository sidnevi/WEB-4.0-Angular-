# Taiga notifications

Angular-стенд двух сценариев: одиночной нотификации и правой панели со стеком событий.

## Стек

- Angular 20, standalone components и signals
- Taiga UI 5 (`@taiga-ui/core`, `@taiga-ui/cdk`, `@taiga-ui/kit`, `@taiga-ui/icons`)
- CSS-анимации на design tokens Taiga UI 5
- inline SVG-sprite для чёткого отображения иконок на нативных размерах

## Запуск

```bash
npm install
npm start
```

Приложение откроется на `http://localhost:4200`.

## Проверка production-сборки

```bash
npm run build
```

Результат сохраняется в `dist/taiga-notifications`.

## Структура

- `src/app/app.ts` — состояние стенда и пользовательские сценарии
- `src/app/app.html` — декларативная разметка экранов
- `src/app/notification-card/` — переиспользуемый компонент карточки
- `src/styles.css` — продуктовые стили поверх темы Taiga UI
- `src/taiga-ui-*.css` — предварительно собранные CSS темы и шрифтов Taiga UI
- `src/app/app.html` — в том числе inline SVG-sprite с исходными векторными контурами
- `public/assets/` — исходные SVG-ассеты проекта
- `ANIMATION-MIGRATION.md` — правила motion для Taiga UI 5
