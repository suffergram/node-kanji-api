# Kanji API

Express API для изучения кандзи. Данные хранятся в **PostgreSQL (Neon)**.

## Структура проекта

```
index.js                  — точка входа, монтирует роутеры
src/db.js                 — подключение к Neon
src/routes/               — маршруты: kanji, vocab, search, lessons
src/utils/                — общие хелперы
src/services/             — вспомогательные функции
```

## Подготовка

### 1. Установить зависимости

```bash
npm install
```

### 2. Добавить строку подключения

Создай файл `.env` в корне проекта и укажи DATABASE_URL

> Данные в базе уже загружены разово при миграции; при развёртывании на новое
> окружение их нужно залить повторно (например, через Neon SQL Editor или psql).

## Запуск локально

```bash
npm start
```

Сервер стартует на `http://localhost:4000`.

## Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/kanji` | все кандзи, фильтры `?jlpt`, `?kanji`, `?limit`, `?random` |
| GET | `/kanji/:id` | кандзи по id |
| GET | `/vocab` | вся лексика, фильтры `?jlpt`, `?word`, `?kanji`, `?kanjiJlpt`, `?limit`, `?random`, `?options` |
| GET | `/vocab/:id` | слово по id |
| GET | `/search/:query` | поиск по кандзи и лексике |
| GET | `/lessons` | уроки, сгруппированные по уровню n5–n1 |