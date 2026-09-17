// Последний рубеж: HTML, который отдаётся, когда SSR упал и React-страницу
// отрисовать уже нечем. Всё инлайном — стилей и скриптов сайта здесь нет.
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Страница не загрузилась</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0a0a12" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #0a0a12; color: #f4f4f8; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #a5a3b5; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #f14ff0; color: #0a0a12; font-weight: 600; }
      .secondary { background: transparent; color: #f4f4f8; border-color: #3a3550; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Страница не загрузилась</h1>
      <p>Что-то пошло не так на нашей стороне. Попробуйте обновить страницу или вернуться на главную.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Обновить</button>
        <a class="secondary" href="/">На главную</a>
      </div>
    </div>
  </body>
</html>`;
}
