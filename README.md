## быстрый запуск

### вариант 1: через docker (рекомендуется)

перед запуском важно:
- папка `frontend/out` должна быть уже собрана заранее

1. в корне проекта запускаем:

```bash
docker compose up --build
```

что произойдет:
- backend применит миграции
- backend запустится на http://localhost:8000
- backend будет раздавать уже готовую статику из frontend/out

полезные команды docker:
- `docker compose up --build` - пересобираем backend-образ и запускаем
- `docker compose up` - запускаем без пересборки
- `docker compose down` - останавливаем и удаляем контейнеры
- `docker compose logs -f backend` - смотрим логи backend в реальном времени
- `docker compose run --rm backend python manage.py migrate` - запускаем миграции вручную

### вариант 2: локально без docker

frontend:

```bash
cd frontend
npm ci
npm run build
```

- `npm run build` - собираем next и получаем статический экспорт в папку frontend/out

backend:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

проверка:
- api: http://localhost:8000/api/ping
- фронт отдается через django: http://localhost:8000

### что именно запускается в docker

- сервис backend:
    - команда: `python manage.py migrate && python manage.py runserver 0.0.0.0:8000`
    - что делает: обновляет базу и поднимает django
    - порт: `8000:8000`
    - дополнительно: подключает frontend/out как read-only, чтобы backend раздавал уже заранее собранный фронт

# структура проекта

этот файл про то, где что лежит и зачем это нужно

## корень

```text
проект-гор-сад/
|-- docker-compose.yml         # тут поднимаем backend в докере (фронт берется из заранее собранного frontend/out)
|-- backend/                   # тут сервер и все api
`-- frontend/                  # тут сайт, страницы и работа с api
```

## backend (django)

```text
backend/
|-- Dockerfile                 # как собрать контейнер backend
|-- manage.py                  # запуск django-команд (миграции, сервер и т.д.)
|-- requirements.txt           # python-пакеты проекта
|-- api/                       # главная папка с api-логикой
|   |-- __init__.py            # технический файл python-пакета
|   |-- admin.py               # что показывать в django admin
|   |-- apps.py                # настройки приложения api
|   |-- models.py              # таблицы бд и связи между ними
|   |-- tests.py               # тесты api
|   |-- urls.py                # тут описываем эндпоинты (ссылки)
|   `-- views.py               # тут описываем логику эндпоинтов
`-- config/
        |-- __init__.py            # технический файл python-пакета
        |-- asgi.py                # запуск в asgi-режиме
        |-- settings.py            # общие настройки django
        |-- urls.py                # подключение /api и отдача фронта
        `-- wsgi.py                # запуск в wsgi-режиме
```

### backend по фичам

- auth и профиль: регистрация, вход, выход, текущий пользователь, редактирование своего профиля, отзывы о пользователе
- блог: список статей и страница одной статьи
- клубы: список клубов, создание, карточка клуба, вступление, выход
- форум: темы, посты в теме, подписки, уведомления
- маркетплейс: объявления, фильтры, создание и редактирование
- обмены: сделки между 2 пользователями, подтверждение сделки, отзывы после сделки
- дневник растений: список растений пользователя и создание растения
- карта: точки на карте (сад/точка обмена)
- сообщения: список диалогов и чат с конкретным пользователем

## frontend (next.js)

```text
frontend/
|-- Dockerfile                 # как собрать контейнер frontend
|-- package.json               # скрипты и зависимости
|-- next.config.ts             # настройки next.js
|-- tsconfig.json              # настройки typescript
|-- eslint.config.mjs          # правила линтера
|-- postcss.config.mjs         # обработка css
|-- next-env.d.ts              # служебные типы next.js
|-- metadata.json              # служебные метаданные
|-- README.md                  # заметки по frontend
|-- app/                       # тут страницы (маршруты)
|   |-- globals.css            # глобальные стили
|   |-- layout.tsx             # общий каркас страницы
|   |-- page.tsx               # главная
|   |-- blog/                  # блог
|   |-- calendar/              # календарь
|   |-- clubs/                 # клубы
|   |-- dashboard/             # личная сводка
|   |-- diary/                 # дневник
|   |-- exchanges/             # обмены
|   |-- forum/                 # форум
|   |-- login/                 # вход
|   |-- map/                   # карта
|   |-- marketplace/           # маркетплейс
|   |-- messages/              # сообщения
|   |-- profile/               # профиль
|   `-- register/              # регистрация
|-- components/
|   `-- layout/
|       `-- AppLayout.tsx      # общий layout-компонент
|-- hooks/
|   `-- use-mobile.ts          # хук для мобилки
|-- lib/
|   `-- utils.ts               # мелкие общие функции
|-- services/
|   `-- api/
|       `-- index.ts           # клиент для работы с api
|-- store/
|   `-- auth.tsx               # состояние авторизации
`-- types/
        `-- api.d.ts               # типы ответов api
```

### frontend по фичам

- auth: [app/login/page.tsx](frontend/app/login/page.tsx), [app/register/page.tsx](frontend/app/register/page.tsx), [store/auth.tsx](frontend/store/auth.tsx)
- профиль: [app/profile/page.tsx](frontend/app/profile/page.tsx)
- блог: [app/blog/page.tsx](frontend/app/blog/page.tsx), [app/blog/post/page.tsx](frontend/app/blog/post/page.tsx)
- клубы: [app/clubs/page.tsx](frontend/app/clubs/page.tsx), [app/clubs/club/page.tsx](frontend/app/clubs/club/page.tsx)
- форум: [app/forum/page.tsx](frontend/app/forum/page.tsx), [app/forum/topic/page.tsx](frontend/app/forum/topic/page.tsx)
- обмены: [app/exchanges/page.tsx](frontend/app/exchanges/page.tsx)
- маркетплейс: [app/marketplace/page.tsx](frontend/app/marketplace/page.tsx)
- дневник: [app/diary/page.tsx](frontend/app/diary/page.tsx), [app/diary/plant/page.tsx](frontend/app/diary/plant/page.tsx)
- карта: [app/map/page.tsx](frontend/app/map/page.tsx)
- сообщения: [app/messages/page.tsx](frontend/app/messages/page.tsx)
- общий api-клиент: [services/api/index.ts](frontend/services/api/index.ts)

## api: эндпоинты и логика (вход/выход)

база: `/api/...`

### системное

- `GET /api/ping`
    - вход: ничего
    - выход: `{ "status": "ok" }`

### auth

- `POST /api/auth/register/`
    - вход: `email`, `password`, `username` (или `name`)
    - выход: `token` (session key) и `user`
- `POST /api/auth/login/`
    - вход: `email`, `password`
    - выход: `token` и `user`
- `POST /api/auth/logout/`
    - вход: авторизация
    - выход: `{ "detail": "Logged out." }`
- `GET /api/auth/user/`
    - вход: авторизация
    - выход: текущий `user`

### профиль

- `GET /api/profiles/{id}/`
    - вход: `id` пользователя
    - выход: публичные данные пользователя
- `PUT /api/profiles/me/`
    - вход: `email` и/или `username` (+ авторизация)
    - выход: обновленный `user`
- `GET /api/profiles/{id}/reviews/`
    - вход: `id` пользователя
    - выход: список отзывов о пользователе

### блог

- `GET /api/articles/`
    - вход: ничего
    - выход: список статей
- `GET /api/articles/{slug}/`
    - вход: `slug`
    - выход: одна статья

### календарь и категории

- `GET /api/calendar/`
    - вход: ничего
    - выход: stub-ответ с `results: []`
  
### клубы

- `GET /api/clubs/`
    - вход: опционально `q` (поиск)
    - выход: список клубов
- `POST /api/clubs/`
    - вход: `name` (или `title`), `description` (+ авторизация)
    - выход: созданный клуб
- `GET /api/clubs/{id}/`
    - вход: `id`
    - выход: детальная карточка клуба + список участников
- `POST /api/clubs/{id}/join/`
    - вход: `id` клуба (+ авторизация)
    - выход: обновленная карточка клуба
- `POST /api/clubs/{id}/leave/`
    - вход: `id` клуба (+ авторизация)
    - выход: обновленная карточка клуба

### форум

- `GET /api/topics/`
    - вход: опционально `q`
    - выход: список тем
- `POST /api/topics/`
    - вход: `title`, `description` (+ авторизация)
    - выход: созданная тема
- `GET /api/topics/{id}/`
    - вход: `id`
    - выход: тема
- `PUT/PATCH /api/topics/{id}/`
    - вход: `title`, `description`, `isClosed` (+ автор, staff)
    - выход: обновленная тема
- `DELETE /api/topics/{id}/`
    - вход: `id` (+ автор, staff)
    - выход: `204 no content`
- `GET /api/topics/{id}/posts/`
    - вход: `id` темы
    - выход: посты темы
- `POST /api/topics/{id}/posts/`
    - вход: `content` (+ авторизация)
    - выход: созданный пост
- `POST /api/topics/{id}/subscribe/`
    - вход: `id` (+ авторизация)
    - выход: `{ "detail": "Subscribed." }`
- `POST /api/topics/{id}/unsubscribe/`
    - вход: `id` (+ авторизация)
    - выход: `{ "detail": "Unsubscribed." }`
- `GET /api/forum/notifications/`
    - вход: авторизация
    - выход: уведомления по форуму
- `POST /api/forum/notifications/{id}/read/`
    - вход: `id` уведомления (+ авторизация)
    - выход: уведомление с `isRead: true`

### маркетплейс

- `GET /api/listings/`
    - вход: опционально `q`, `category`
    - выход: список активных объявлений
- `POST /api/listings/`
    - вход: `title`, `description`, `category`, опционально `location`, `imageUrl` (+ авторизация)
    - выход: созданное объявление
- `GET /api/listings/{id}/`
    - вход: `id`
    - выход: объявление
- `PUT/PATCH /api/listings/{id}/`
    - вход: любые поля объявления (+ владелец или staff)
    - выход: обновленное объявление
- `DELETE /api/listings/{id}/`
    - вход: `id` (+ владелец или staff)
    - выход: `204 no content`

### обмены

- `GET /api/exchanges/`
    - вход: авторизация
    - выход: мои обмены (где я участник)
- `POST /api/exchanges/`
    - вход: `counterpartyId`, `itemsFromInitiator`, `itemsFromCounterparty` (+ авторизация)
    - выход: созданный обмен
- `GET /api/exchanges/{id}/`
    - вход: `id` (+ доступ участника)
    - выход: обмен
- `PATCH /api/exchanges/{id}/`
    - вход: правки по предметам или `status=cancelled` (+ доступ участника)
    - выход: обновленный обмен
- `DELETE /api/exchanges/{id}/`
    - вход: `id` (+ доступ участника)
    - выход: `204 no content`
- `POST /api/exchanges/{id}/confirm/`
    - вход: `id` (+ участник обмена)
    - выход: обмен; когда подтвердили оба, статус станет `completed`
- `GET /api/exchanges/{id}/reviews/`
    - вход: `id` (+ участник обмена)
    - выход: отзывы по обмену
- `POST /api/exchanges/{id}/reviews/`
    - вход: `targetId`, `rating` (1..5), опционально `comment` (+ участник завершенного обмена)
    - выход: созданный отзыв

### дневник растений

- `GET /api/diary/`
    - вход: авторизация
    - выход: список моих растений + краткая инфа по записям
- `POST /api/diary/`
    - вход: `name` (или `plantName`), опционально `description` (+ авторизация)
    - выход: созданное растение

### карта

- `GET /api/map/`
    - вход: ничего
    - выход: список точек
- `POST /api/map/`
    - вход: `title`, `lat`, `lng`, опционально `description`, `type` (+ авторизация)
    - выход: созданная точка

### пользователи и сообщения

- `GET /api/users/`
    - вход: авторизация
    - выход: список пользователей (кроме меня)
- `GET /api/messages/`
    - вход: авторизация
    - выход: список диалогов + последнее сообщение + непрочитанные
- `GET /api/messages/{userId}/`
    - вход: `userId` (+ авторизация)
    - выход: история сообщений с пользователем
- `POST /api/messages/{userId}/`
    - вход: `content` (+ авторизация)
    - выход: отправленное сообщение
