// Меняем версию кэша, чтобы заставить браузер обновиться
const CACHE_NAME = 'ppo-app-cache-v2'; 

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/compass.js',
  './js/report.js',
  './js/directory.js',
  './js/targetSearch.js',
  './js/weaponManager.js',
  './js/dbEditor.js'
];

// Установка: кэшируем новые файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // Активируем SW сразу без ожидания
  );
});

// Активация: чистим старый кэш предыдущих версий
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Видаляємо старий кеш:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Немедленно берем под контроль все вкладки
  );
});

// Запросы: сначала пробуем сеть, если сети нет — берем из кэша (Network-first)
// Это идеальная стратегия для разработки: если интернет есть, изменения сразу видны
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если запрос успешен, дублируем его в кэш
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Офлайн-режим: достаем из кэша
        return caches.match(event.request);
      })
  );
});
