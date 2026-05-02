# LYRA — Conversation Viewer

PWA для просмотра JSON-экспортов из VRS/A.

## Структура

```
LYRA-APP/
├── index.html
├── manifest.json
├── sw.js
├── favicon.ico
├── assets/
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   ├── app.js        # точка входа
│   │   ├── parser.js     # парсинг user/assistant
│   │   ├── render.js     # построение карточек
│   │   ├── sidebar.js    # навигация
│   │   └── storage.js    # localStorage
│   └── icons/
└── README.md
```

## Деплой на GitHub Pages

1. Загрузи все файлы в репозиторий `LYRA-APP`
2. Settings → Pages → Source: `main` branch, `/ (root)`
3. Приложение будет доступно на `https://kartg33.github.io/LYRA-APP/`

## PWA

Приложение устанавливается как PWA на Android и iOS через браузер.
