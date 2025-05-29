const CACHE_NAME = 'subscription-manager-v1';
const CORE_ASSETS_CACHE_NAME = 'subscription-manager-core-v1';
const DYNAMIC_CACHE_NAME = 'subscription-manager-dynamic-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json', // manifest文件也应该被缓存
  // 图标文件 - 确保这些文件存在于 /icons/ 目录下
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // 如果有字体文件或其他核心静态资源，也在这里列出
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js' // Chart.js库也缓存起来
];

// 安装 Service Worker 并缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE_ASSETS_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting()) // 强制新的 Service Worker 激活
  );
});

// 激活 Service Worker 并清理旧缓存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CORE_ASSETS_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // 控制所有打开的客户端
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 策略1: API 请求 (exchangerate-api.com) - Network falling back to cache
  if (url.hostname === 'v6.exchangerate-api.com') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return cache.match(event.request);
        });
      })
    );
    return; // 确保此策略被执行后不再继续
  }

  // 策略2: Google Favicon / ui-avatars / 其他图片资源 - Stale-While-Revalidate
  if (url.hostname === 'www.google.com' && url.pathname.startsWith('/s2/favicons') || 
      url.hostname === 'ui-avatars.com') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return; // 确保此策略被执行后不再继续
  }
  
  // 策略3: Chart.js CDN - Cache first, fallback to network (因为它在CORE_ASSETS中，其实会被install时缓存)
  // 但为了更明确，可以单独处理或依赖CORE_ASSETS的缓存
  if (url.href === 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request).then(networkResponse => {
            // 可选：如果需要，也可以将CDN资源放入动态缓存
            // caches.open(DYNAMIC_CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
            return networkResponse;
          });
        })
    );
    return;
  }

  // 策略4: 核心应用资源 (HTML, CSS, JS, Manifest, 本地图标) - Cache first, fallback to network
  // 这个主要通过 install 事件的 pre-caching 和下面的 caches.match 实现
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request); // 如果缓存未命中，则从网络获取
      })
  );
}); 