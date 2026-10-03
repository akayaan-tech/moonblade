const CACHE_NAME = 'moonblade-arena-v1';
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './vendor/phaser.min.js',
  './src/main.js',
  './src/config.js',
  './src/controls/TouchControls.js',
  './src/entities/Player.js',
  './src/entities/Enemy.js',
  './src/entities/Projectile.js',
  './src/scenes/MenuScene.js',
  './src/scenes/ArenaScene.js',
  './src/systems/SaveSystem.js',
  './src/systems/AudioSystem.js',
  './src/systems/TextureFactory.js',
  './src/systems/WeaponSystem.js',
  './src/systems/UpgradeSystem.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const urls = PRECACHE.map((path) => new URL(path, self.registration.scope).href);
    await cache.addAll(urls);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('moonblade-arena-') && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== scopeUrl.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch {
      if (request.mode === 'navigate') {
        const fallback = await cache.match(new URL('index.html', scopeUrl).href);
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
